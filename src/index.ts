import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import {
  parseProgramCsv,
  parseParametersCsv,
  parseNovosParametrosCsv,
  parseNovosExerciciosCsv,
  parseNovosConteudosCsv,
  parseBiometricSchedulesCsv,
  parseContentPlansCsv,
  parseContentsCsv,
} from "./csvParser.js";
import { generateTemplateSql, generateBpSql, generatePreSql, generateContentSql, generateConteudosSql } from "./sqlGenerators.js";

const CSV_DIR = join(import.meta.dirname, "..", "csv");
const OUTPUT_DIR = join(import.meta.dirname, "..", "output");

interface CsvGroup {
  programFile: string;
  parametersFile: string;
  novosParametrosFile: string | null;
  novosExerciciosFile: string | null;
  recorrenciaFile: string | null;
  contentsFile: string | null;
  label: string;
}

interface NovosOnly {
  novosParametrosFile: string;
  label: string;
}

interface ExerciciosOnly {
  novosExerciciosFile: string;
  label: string;
}

interface ConteudosOnly {
  novosConteudosFile: string;
  label: string;
}

function labelFromPrefix(prefix: string): string {
  return prefix.replace(/^TabelaTemplatesProgramas_/, "").replace(/_$/, "");
}

function discoverCsvGroups(dir: string): CsvGroup[] {
  const files = readdirSync(dir);
  const groups: CsvGroup[] = [];

  const programFiles = files.filter((f) => f.includes("(Programa)") && f.endsWith(".csv"));

  for (const pf of programFiles) {
    const prefix = pf.split("(Programa)")[0];

    const paramFile = files.find(
      (f) => f.startsWith(prefix) && f.includes("(Template_parametros)") && f.endsWith(".csv")
    );
    if (!paramFile) {
      console.warn(`Warning: no matching Template_parametros CSV for: ${pf}`);
      continue;
    }

    const novosParametrosFile = files.find(
      (f) => f.startsWith(prefix) && f.includes("(Novos_parametros)") && f.endsWith(".csv")
    ) || null;

    const novosExerciciosFile = files.find(
      (f) => f.startsWith(prefix) && f.includes("(Novos_exercicios)") && f.endsWith(".csv")
    ) || null;

    const recorrenciaFile = files.find(
      (f) => f.startsWith(prefix) && f.includes("(Template_recorrencia)") && f.endsWith(".csv")
    ) || null;

    const contentsFile = files.find(
      (f) => f.startsWith(prefix) && f.includes("(Template_conteudos)") && f.endsWith(".csv")
    ) || null;

    groups.push({
      programFile: join(dir, pf),
      parametersFile: join(dir, paramFile),
      novosParametrosFile: novosParametrosFile ? join(dir, novosParametrosFile) : null,
      novosExerciciosFile: novosExerciciosFile ? join(dir, novosExerciciosFile) : null,
      recorrenciaFile: recorrenciaFile ? join(dir, recorrenciaFile) : null,
      contentsFile: contentsFile ? join(dir, contentsFile) : null,
      label: labelFromPrefix(prefix),
    });
  }

  return groups;
}

function discoverNovosParametros(dir: string): NovosOnly[] {
  return readdirSync(dir)
    .filter((f) => f.includes("(Novos_parametros)") && f.endsWith(".csv"))
    .map((f) => ({
      novosParametrosFile: join(dir, f),
      label: labelFromPrefix(f.split("(Novos_parametros)")[0]),
    }));
}

function discoverNovosExercicios(dir: string): ExerciciosOnly[] {
  return readdirSync(dir)
    .filter((f) => f.includes("(Novos_exercicios)") && f.endsWith(".csv"))
    .map((f) => ({
      novosExerciciosFile: join(dir, f),
      label: labelFromPrefix(f.split("(Novos_exercicios)")[0]),
    }));
}

function discoverNovosConteudos(dir: string): ConteudosOnly[] {
  return readdirSync(dir)
    .filter((f) => f.includes("(Novos_conteudos)") && f.endsWith(".csv"))
    .map((f) => ({
      novosConteudosFile: join(dir, f),
      label: labelFromPrefix(f.split("(Novos_conteudos)")[0]),
    }));
}

function writeBpSql(novosFile: string, label: string): void {
  const newParameters = parseNovosParametrosCsv(novosFile);
  const bpSql = generateBpSql(newParameters);
  if (!bpSql) {
    console.log(`  -> 01-BP.sql skipped (no new parameters)`);
    return;
  }
  const bpPath = join(OUTPUT_DIR, `${label}_01-BP.sql`);
  writeFileSync(bpPath, bpSql, "utf-8");
  console.log(`  -> 01-BP.sql (${newParameters.length} new parameter(s))`);
}

function writePreSql(novosExerciciosFile: string, label: string): void {
  const newExercises = parseNovosExerciciosCsv(novosExerciciosFile);
  const preSql = generatePreSql(newExercises);
  if (!preSql) {
    console.log(`  -> 01-PRE.sql skipped (no new exercises)`);
    return;
  }
  const prePath = join(OUTPUT_DIR, `${label}_01-PRE.sql`);
  writeFileSync(prePath, preSql, "utf-8");
  console.log(`  -> 01-PRE.sql (${newExercises.length} new exercise(s))`);
}

function writeContentSql(novosConteudosFile: string, label: string): void {
  const newContents = parseNovosConteudosCsv(novosConteudosFile);
  const contentSql = generateContentSql(newContents);
  if (!contentSql) {
    console.log(`  -> 01-Content.sql skipped (no new contents)`);
    return;
  }
  const contentPath = join(OUTPUT_DIR, `${label}_01-Content.sql`);
  writeFileSync(contentPath, contentSql, "utf-8");
  console.log(`  -> 01-Content.sql (${newContents.length} new content(s))`);
}

function runOnlyNovosParametros(): void {
  const items = discoverNovosParametros(CSV_DIR);
  if (items.length === 0) {
    console.error("No Novos_parametros CSV found in:", CSV_DIR);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const item of items) {
    console.log(`\nProcessing: ${item.label}`);
    console.log(`  Novos CSV: ${basename(item.novosParametrosFile)}`);
    writeBpSql(item.novosParametrosFile, item.label);
  }

  console.log("\nDone! Output written to:", OUTPUT_DIR);
}

function runOnlyNovosExercicios(): void {
  const items = discoverNovosExercicios(CSV_DIR);
  if (items.length === 0) {
    console.error("No Novos_exercicios CSV found in:", CSV_DIR);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const item of items) {
    console.log(`\nProcessing: ${item.label}`);
    console.log(`  Exercicios CSV: ${basename(item.novosExerciciosFile)}`);
    writePreSql(item.novosExerciciosFile, item.label);
  }

  console.log("\nDone! Output written to:", OUTPUT_DIR);
}

function runOnlyNovosConteudos(): void {
  const items = discoverNovosConteudos(CSV_DIR);
  if (items.length === 0) {
    console.error("No Novos_conteudos CSV found in:", CSV_DIR);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const item of items) {
    console.log(`\nProcessing: ${item.label}`);
    console.log(`  Conteudos CSV: ${basename(item.novosConteudosFile)}`);
    writeContentSql(item.novosConteudosFile, item.label);
  }

  console.log("\nDone! Output written to:", OUTPUT_DIR);
}

function runFullGeneration(): void {
  const groups = discoverCsvGroups(CSV_DIR);
  if (groups.length === 0) {
    console.error("No CSV groups found in:", CSV_DIR);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Conteudos catalog is decoupled from any specific program; emit once after parameters/exercises
  // (on the first program iteration) and before that program's template inserts.
  const conteudos = discoverNovosConteudos(CSV_DIR);
  let conteudosEmitted = false;

  for (const group of groups) {
    console.log(`\nProcessing: ${group.label}`);
    console.log(`  Program CSV:    ${basename(group.programFile)}`);
    console.log(`  Parameters CSV: ${basename(group.parametersFile)}`);
    if (group.novosParametrosFile) {
      console.log(`  Novos CSV:      ${basename(group.novosParametrosFile)}`);
    }
    if (group.novosExerciciosFile) {
      console.log(`  Exercicios CSV: ${basename(group.novosExerciciosFile)}`);
    }
    if (group.recorrenciaFile) {
      console.log(`  Recorrencia CSV:${basename(group.recorrenciaFile)}`);
    }
    if (group.contentsFile) {
      console.log(`  Contents CSV:   ${basename(group.contentsFile)}`);
    }

    const program = parseProgramCsv(group.programFile);
    const parameters = parseParametersCsv(group.parametersFile);
    const schedules = group.recorrenciaFile
      ? parseBiometricSchedulesCsv(group.recorrenciaFile)
      : [];

    console.log(`  Program: ${program.name} (${program.code})`);
    console.log(`  Parameters: ${parameters.length}, Schedules: ${schedules.length}`);

    if (group.novosParametrosFile) {
      writeBpSql(group.novosParametrosFile, group.label);
    } else {
      console.log(`  -> 01-BP.sql skipped (no Novos_parametros CSV)`);
    }

    if (group.novosExerciciosFile) {
      writePreSql(group.novosExerciciosFile, group.label);
    } else {
      console.log(`  -> 01-PRE.sql skipped (no Novos_exercicios CSV)`);
    }

    if (!conteudosEmitted) {
      for (const item of conteudos) {
        console.log(`  Conteudos catalog: ${basename(item.novosConteudosFile)}`);
        writeContentSql(item.novosConteudosFile, item.label);
      }
      if (conteudos.length === 0) {
        console.log(`  -> 01-Content.sql skipped (no Novos_conteudos CSV)`);
      }
      conteudosEmitted = true;
    }

    const templateSql = generateTemplateSql(program, parameters, schedules);
    const templatePath = join(OUTPUT_DIR, `${group.label}_02-Template.sql`);
    writeFileSync(templatePath, templateSql, "utf-8");
    console.log(`  -> 02-Template.sql`);

    if (group.contentsFile && group.recorrenciaFile) {
      const plans = parseContentPlansCsv(group.recorrenciaFile);
      const items = parseContentsCsv(group.contentsFile);
      console.log(`  Plans: ${plans.length}, Items: ${items.length}`);

      const conteudosSql = generateConteudosSql(program.code, plans, items);
      const conteudosPath = join(OUTPUT_DIR, `${group.label}_03-Conteudos.sql`);
      writeFileSync(conteudosPath, conteudosSql, "utf-8");
      console.log(`  -> 03-Conteudos.sql`);
    } else {
      const missing = [
        group.contentsFile ? null : "Template_conteudos",
        group.recorrenciaFile ? null : "Template_recorrencia",
      ].filter(Boolean).join(" + ");
      console.log(`  -> 03-Conteudos.sql skipped (no ${missing} CSV)`);
    }
  }

  console.log("\nDone! Output written to:", OUTPUT_DIR);
}

async function main(): Promise<void> {
  console.log("=== Template Generator ===\n");
  console.log("  1) Crear nuevos parámetros biométricos (solo 01-BP.sql)");
  console.log("  2) Crear nuevos exercicios (solo 01-PRE.sql)");
  console.log("  3) Crear nuevos conteudos (solo 01-Content.sql)");
  console.log("  4) Generar template completo (01-BP + 01-PRE + 01-Content + 02-Template + 03-Conteudos)");
  console.log("  q) Salir\n");

  const rl = createInterface({ input, output });
  const choice = (await rl.question("Selecciona una opción: ")).trim().toLowerCase();
  rl.close();

  switch (choice) {
    case "1":
      runOnlyNovosParametros();
      break;
    case "2":
      runOnlyNovosExercicios();
      break;
    case "3":
      runOnlyNovosConteudos();
      break;
    case "4":
      runFullGeneration();
      break;
    case "q":
    case "":
      console.log("Cancelado.");
      break;
    default:
      console.error(`Opción inválida: "${choice}"`);
      process.exit(1);
  }
}

main();
