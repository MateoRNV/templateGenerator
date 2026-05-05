import { readFileSync } from "fs";
import type { ProgramData, TemplateParameter, NewParameter, NewExercise, NewContent, BiometricSchedule, WeekDaySchedule, ContentPlan, EducationalContentItem } from "./types.js";

function parseNum(val: string): number | null {
  if (!val) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function readCsvFile(filePath: string): string[][] {
  // CSVs may come as Windows-1252 (Excel default on Windows) or UTF-8 (re-saved by an editor).
  // Try strict UTF-8 first; fall back to latin1 when bytes don't form valid UTF-8.
  const buf = readFileSync(filePath);
  let raw: string;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    raw = buf.toString("latin1");
  }

  const separator = detectSeparator(raw);
  return parseCsvText(raw, separator);
}

function detectSeparator(text: string): string {
  // Count `;` vs `,` outside of quoted regions in the first physical line.
  let semis = 0;
  let commas = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n") break;
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === ";") semis++;
    if (ch === ",") commas++;
  }
  return commas > semis ? "," : ";";
}

function parseCsvText(text: string, separator: string = ";"): string[][] {
  const rows: string[][] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    cells.push(cell.trim());
    cell = "";
  };

  const pushRow = () => {
    if (cells.some((c) => c.length > 0)) rows.push(cells);
    cells = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === separator) {
      pushCell();
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      pushCell();
      pushRow();
      continue;
    }
    cell += ch;
  }

  if (cell.length > 0 || cells.length > 0) {
    pushCell();
    pushRow();
  }

  return rows;
}

export function parseProgramCsv(filePath: string): ProgramData {
  const rows = readCsvFile(filePath);
  // Row 0 = headers: Programa;partilhavel;code
  // Row 1 = data
  if (rows.length < 2) {
    throw new Error(`Program CSV must have at least 2 rows (header + data): ${filePath}`);
  }

  const data = rows[1];
  return {
    name: data[0],
    isShareable: data[1].toLowerCase() === "sim",
    code: data[2],
  };
}

function normalizeAccents(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim();
}

export function parseParametersCsv(filePath: string): TemplateParameter[] {
  const rows = readCsvFile(filePath);
  // Header columns: Programa;Tipo de prescrição;Prescrição;Code;Modo de medição;Dispositivo;Dispositivo code;Monitorização recorrente;Duração
  // For now only rows with Tipo de prescrição = "Parâmetro biométrico" are emitted.

  const parameters: TemplateParameter[] = [];

  for (const row of rows) {
    if (!row[3]) continue;
    if (normalizeAccents(row[3]) === "code") continue; // skip header
    if (!normalizeAccents(row[1]).includes("biom")) continue;

    parameters.push({
      order: parameters.length + 1,
      name: row[2],
      code: row[3],
      measurementMode: row[4] || "",
      deviceName: row[5] || "",
      deviceCode: row[6] || "",
      durationDays: Number(row[8]) || 365,
      isRecurring: normalizeAccents(row[7] || "") === "sim",
    });
  }

  return parameters;
}

export function parseBiometricSchedulesCsv(filePath: string): BiometricSchedule[] {
  const rows = readCsvFile(filePath);
  // Header: Programa(0);Tipo(1);Prescrição(2);Code(3);Modo(4);Disp(5);Disp code(6);Monit recorrente(7);Duração(8);Configuração(9);Período(10);Periodo code(11);Seg(12)..Dom(18);Conteudos por dia(19)
  // One schedule per row whose Tipo de prescrição is "Parâmetro biométrico" and that is recurring.

  const timePattern = /^\d{1,2}:\d{2}$/;
  const schedules: BiometricSchedule[] = [];

  for (const row of rows) {
    if (!row[3]) continue;
    if (normalizeAccents(row[3]) === "code") continue;
    if (!normalizeAccents(row[1]).includes("biom")) continue;
    if (normalizeAccents(row[7] || "") !== "sim") continue;

    const weekDays: WeekDaySchedule[] = [];
    for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
      const cell = row[11 + dayNumber] || "";
      const times = cell.split("/").map((t) => t.trim()).filter((t) => timePattern.test(t));
      if (times.length === 0) continue;
      weekDays.push({ dayNumber, times });
    }

    schedules.push({
      code: row[3],
      periodCode: row[11] || "",
      weekDays,
    });
  }

  return schedules;
}

export function parseNovosParametrosCsv(filePath: string): NewParameter[] {
  const rows = readCsvFile(filePath);
  // Row 0 = headers: Nome do parametro;Code;ShortDescription;Categoria;Categoria code;Casa Decimal;MinValue;MaxValue;Incremento;Unidad de medida;Chart Increment
  // Rows 1+ = data. Drives ClinicalDataType inserts (01-BP.sql).

  const params: NewParameter[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[1]) continue;

    params.push({
      name: row[0],
      code: row[1],
      shortDescription: row[2] || "",
      category: row[3] || "",
      categoryCode: row[4] || "",
      decimalPrecision: parseNum(row[5]),
      minValue: parseNum(row[6]),
      maxValue: parseNum(row[7]),
      increment: parseNum(row[8]),
      measurementUnit: row[9] || "",
      chartIncrement: parseNum(row[10]),
    });
  }

  return params;
}

function deriveCodeFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

interface ExerciseHeaderMap {
  name: number;
  code: number;
  shortName: number;
  objective: number;
  instructions: number;
}

function findExerciseHeaderRow(rows: string[][]): { row: string[]; index: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let hasName = false;
    let hasObjective = false;
    let hasInstructions = false;
    for (const cell of row) {
      const norm = normalizeAccents(cell);
      if (norm.startsWith("nome")) hasName = true;
      if (norm.startsWith("objetiv") || norm.startsWith("objectiv")) hasObjective = true;
      if (norm.startsWith("instruc") || norm.startsWith("instruct")) hasInstructions = true;
    }
    if (hasName && (hasObjective || hasInstructions)) return { row, index: i };
  }
  return null;
}

function buildExerciseHeaderMap(headerRow: string[]): ExerciseHeaderMap {
  const map: ExerciseHeaderMap = { name: -1, code: -1, shortName: -1, objective: -1, instructions: -1 };
  for (let i = 0; i < headerRow.length; i++) {
    const norm = normalizeAccents(headerRow[i]);
    if (norm.startsWith("nome do exercicio") || norm === "nome" || norm === "name") {
      if (map.name === -1) map.name = i;
    } else if (norm === "code" || norm === "codigo") {
      map.code = i;
    } else if (norm.startsWith("shortname") || norm.startsWith("short name") || norm.startsWith("nome curto") || norm.startsWith("shortdescription") || norm.startsWith("short description")) {
      map.shortName = i;
    } else if (norm.startsWith("objetiv") || norm.startsWith("objectiv")) {
      map.objective = i;
    } else if (norm.startsWith("instruc") || norm.startsWith("instruct")) {
      map.instructions = i;
    }
  }
  return map;
}

export function parseNovosExerciciosCsv(filePath: string): NewExercise[] {
  const rows = readCsvFile(filePath);
  const header = findExerciseHeaderRow(rows);
  if (!header) {
    throw new Error(`Could not find exercise header row in: ${filePath}`);
  }

  const cols = buildExerciseHeaderMap(header.row);
  if (cols.name === -1) {
    throw new Error(`Exercise CSV must include a 'Nome' column: ${filePath}`);
  }

  const exercises: NewExercise[] = [];

  for (let i = header.index + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = collapseWhitespace(row[cols.name] || "");
    if (!name) continue;

    const csvCode = cols.code !== -1 ? collapseWhitespace(row[cols.code] || "") : "";
    const code = csvCode || deriveCodeFromName(name);

    const csvShortName = cols.shortName !== -1 ? collapseWhitespace(row[cols.shortName] || "") : "";
    const shortDescription = csvShortName || name;

    const objective = cols.objective !== -1 ? collapseWhitespace(row[cols.objective] || "") : "";
    const instructions = cols.instructions !== -1 ? collapseWhitespace(row[cols.instructions] || "") : "";

    exercises.push({
      order: exercises.length + 1,
      code,
      description: name,
      shortDescription,
      objective,
      instructions,
    });
  }

  return exercises;
}

export function parseNovosConteudosCsv(filePath: string): NewContent[] {
  const rows = readCsvFile(filePath);
  // Header (col index): 0=ordem, 1=Nome do conteudo, 2=code, 3=Categoria, 4=Category code, 5=Descrição, 6=Objetivo
  // The CSV is comma-separated; readCsvFile auto-detects the separator.

  const items: NewContent[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[2]) continue;

    items.push({
      order: Number(row[0]) || items.length + 1,
      title: collapseWhitespace(row[1] || ""),
      code: collapseWhitespace(row[2] || ""),
      category: collapseWhitespace(row[3] || ""),
      categoryCode: collapseWhitespace(row[4] || ""),
      description: collapseWhitespace(row[5] || ""),
      objective: collapseWhitespace(row[6] || ""),
    });
  }

  return items;
}

export function parseContentPlansCsv(filePath: string): ContentPlan[] {
  const rows = readCsvFile(filePath);
  // Recorrencia headers: Programa;Tipo de prescrição;Prescrição;Code;Modo de medição;Dispositivo;Dispositivo code;Monitorização recorrente;Duração;Configuração datas e horas;Período a monitorizar;Seg;Ter;Qua;Qui;Sex;Sab;Dom;Conteudos por dia
  // Plans come from rows whose Tipo de prescrição starts with "Conteúdos" / "Conteudos".

  const plans: ContentPlan[] = [];

  for (const row of rows) {
    if (!row[1] || !row[2]) continue;
    if (!normalizeAccents(row[1]).includes("conte")) continue;

    plans.push({
      description: row[2],
      durationDays: Number(row[8]) || 365,
      contentsPerDay: Number(row[19]) || 1,
    });
  }

  return plans;
}

export function parseContentsCsv(filePath: string): EducationalContentItem[] {
  const rows = readCsvFile(filePath);
  // Header row 0: ;Nome do conteúdo;ID interno;Preplano
  // Rows 1+ = data. One row per content item; planDescription links to a ContentPlan via "Preplano".

  const items: EducationalContentItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[2]) continue;

    items.push({
      order: Number(row[0]) || (items.length + 1),
      name: row[1],
      code: row[2],
      planDescription: row[3] || "",
      isActive: true,
    });
  }

  return items;
}
