import { readFileSync } from "fs";
import type { ProgramData, TemplateParameter, ContentPlanConfig, EducationalContentItem } from "./types.js";

function readCsvFile(filePath: string): string[][] {
  // CSV files exported from Excel on Windows are typically Windows-1252
  const raw = readFileSync(filePath, "latin1");

  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(";").map((cell) => cell.trim()));
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

export function parseParametersCsv(filePath: string): TemplateParameter[] {
  const rows = readCsvFile(filePath);
  // Row 0 = headers: ;Nome do conteúdo;Code;Modo de medição;Dispositivo;Dispositivo Code;Duração (dias);New;ShortDesc;Categoria;Categoria Code;Decimal;MinValue;MaxValue;Incremento;Unidad de medida;Chart Increment
  // Rows 1+ = data (first column is the row number)

  const parameters: TemplateParameter[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip empty rows (no code)
    if (!row[2]) continue;

    const parseNum = (val: string): number | null => {
      if (!val) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    parameters.push({
      order: Number(row[0]) || i,
      name: row[1],
      code: row[2],
      measurementMode: row[3] || "",
      deviceName: row[4] || "",
      deviceCode: row[5] || "",
      durationDays: Number(row[6]) || 365,
      isNew: (row[7] || "").toLowerCase() === "sim",
      shortDescription: row[8] || "",
      category: row[9] || "",
      categoryCode: row[10] || "",
      decimalPrecision: parseNum(row[11]),
      minValue: parseNum(row[12]),
      maxValue: parseNum(row[13]),
      increment: parseNum(row[14]),
      measurementUnit: row[15] || "",
      chartIncrement: parseNum(row[16]),
    });
  }

  return parameters;
}

function isTruthy(val: string): boolean {
  const v = val.toLowerCase();
  return v === "sim" || v === "true" || v === "1";
}

export function parseContentsCsv(filePath: string): { config: ContentPlanConfig; items: EducationalContentItem[] } {
  const rows = readCsvFile(filePath);

  // The file contains two tables separated by an empty-ish row.
  // Table 1 (rows 0-1): config header + data  →  ;duracao;conteudos por dia
  // Table 2 (rows 3+):  items header + data   →  ;Nome do conteúdo;ID interno;Optional

  // Parse config (row 1)
  const configRow = rows[1];
  const config: ContentPlanConfig = {
    durationDays: Number(configRow[1]) || 365,
    contentsPerDay: Number(configRow[2]) || 1,
  };

  // Find the items header row (contains "ID interno")
  let itemsStart = -1;
  for (let i = 2; i < rows.length; i++) {
    const joined = rows[i].join(";").toLowerCase();
    if (joined.includes("id interno") || joined.includes("nome do conte")) {
      itemsStart = i + 1;
      break;
    }
  }

  if (itemsStart === -1) {
    throw new Error(`Could not find items table header in: ${filePath}`);
  }

  const items: EducationalContentItem[] = [];
  for (let i = itemsStart; i < rows.length; i++) {
    const row = rows[i];
    // Skip rows without a code (column 2)
    if (!row[2]) continue;

    items.push({
      order: Number(row[0]) || (items.length + 1),
      name: row[1],
      code: row[2],
      isOptional: isTruthy(row[3] || ""),
    });
  }

  return { config, items };
}
