import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { parseProgramCsv, parseParametersCsv, parseContentsCsv } from "./csvParser.js";
import { generateTemplateSql, generateBpSql, generateConteudosSql } from "./sqlGenerators.js";

const CSV_DIR = join(import.meta.dirname, "..", "csv");
const OUTPUT_DIR = join(import.meta.dirname, "..", "output");

interface CsvGroup {
  programFile: string;
  parametersFile: string;
  contentsFile: string | null;
  label: string;
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

    const contentsFile = files.find(
      (f) => f.startsWith(prefix) && f.includes("(Template_conteudos)") && f.endsWith(".csv")
    ) || null;

    const label = prefix.replace(/^TabelaTemplatesProgramas_/, "").replace(/_$/, "");
    groups.push({
      programFile: join(dir, pf),
      parametersFile: join(dir, paramFile),
      contentsFile: contentsFile ? join(dir, contentsFile) : null,
      label,
    });
  }

  return groups;
}

function main(): void {
  console.log("Template Generator - CSV to SQL\n");

  const groups = discoverCsvGroups(CSV_DIR);
  if (groups.length === 0) {
    console.error("No CSV groups found in:", CSV_DIR);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const group of groups) {
    console.log(`Processing: ${group.label}`);
    console.log(`  Program CSV:    ${basename(group.programFile)}`);
    console.log(`  Parameters CSV: ${basename(group.parametersFile)}`);
    if (group.contentsFile) {
      console.log(`  Contents CSV:   ${basename(group.contentsFile)}`);
    }

    const program = parseProgramCsv(group.programFile);
    const parameters = parseParametersCsv(group.parametersFile);

    console.log(`  Program: ${program.name} (${program.code})`);
    console.log(`  Parameters: ${parameters.length}`);

    // 01-BP.sql
    const bpSql = generateBpSql(parameters);
    if (bpSql) {
      const bpPath = join(OUTPUT_DIR, `${group.label}_01-BP.sql`);
      writeFileSync(bpPath, bpSql, "utf-8");
      const newCount = parameters.filter((p) => p.isNew).length;
      console.log(`  -> 01-BP.sql (${newCount} new parameter(s))`);
    } else {
      console.log(`  -> 01-BP.sql skipped (no new parameters)`);
    }

    // 02-Template.sql
    const templateSql = generateTemplateSql(program, parameters);
    const templatePath = join(OUTPUT_DIR, `${group.label}_02-Template.sql`);
    writeFileSync(templatePath, templateSql, "utf-8");
    console.log(`  -> 02-Template.sql`);

    // 03-Conteudos.sql
    if (group.contentsFile) {
      const { config, items } = parseContentsCsv(group.contentsFile);
      console.log(`  Contents: ${items.length} items (${config.durationDays} days, ${config.contentsPerDay}/day)`);

      const conteudosSql = generateConteudosSql(program.code, config, items);
      const conteudosPath = join(OUTPUT_DIR, `${group.label}_03-Conteudos.sql`);
      writeFileSync(conteudosPath, conteudosSql, "utf-8");
      console.log(`  -> 03-Conteudos.sql`);
    } else {
      console.log(`  -> 03-Conteudos.sql skipped (no Template_conteudos CSV)`);
    }

    console.log();
  }

  console.log("Done! Output written to:", OUTPUT_DIR);
}

main();
