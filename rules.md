# Template Generator - Rules & Reference

## Overview

CLI tool that reads CSV files exported from Excel and generates SQL Server scripts for the TeleHealth platform. The CSVs are prepared by functional analysts and describe programs/templates with their biometric parameters and educational content.

## Hard Constraints

- **No Python.** Node.js + TypeScript only.
- **No Excel readers.** Never install xlsx/exceljs or similar. Only read `.csv` files.
- **No database connections.** This tool generates `.sql` files — it never executes them.
- **No frontend.** This is a CLI tool only.
- **Never modify the original CSVs.** They are read-only input.

---

## CSV Input

### Encoding

CSV files are exported from Excel on Windows (Windows-1252 / latin1). When an editor re-saves them as UTF-8 the Portuguese characters can survive or get mangled to U+FFFD replacement chars; the parser tries strict UTF-8 first and falls back to latin1, so both encodings work for most cells.

Type filters (e.g. `Tipo de prescrição = Parâmetro biométrico`) use lenient substring matching after stripping accents and non-ASCII characters, so files with corrupted accents still classify correctly. Free-text values copied straight to SQL (e.g. plan descriptions) are emitted as-is — re-export the CSV with proper encoding if accents must be preserved in the output.

### Separator

Most CSVs use **semicolon (`;`)** as the column separator. The parser auto-detects between `;` and `,` per file by counting unquoted occurrences in the first line — `Novos_conteudos.csv` happens to use `,` and is handled transparently.

### File Naming Convention

CSVs follow this naming pattern:

```
TabelaTemplatesProgramas_{ProgramName}({SheetType}).csv
```

Where `{SheetType}` is one of:
- `Programa` — program-level data (one row)
- `Template_parametros` — biometric parameters that will be linked to the template (multiple rows)
- `Novos_parametros` — *optional*: new biometric parameters that need to be created in `ClinicalDataType` first
- `Novos_exercicios` — *optional*: physical exercises that need to be created in `PRePhysicalExercise` (the catalog) before the template references them
- `Novos_conteudos` — *optional*: educational content items that need to be created in `EducationalContent.[Item]` (the catalog) before any plan references them. The file isn't anchored to a program prefix — its label is whatever appears before `(Novos_conteudos)` in the filename (e.g. `Libro(Novos_conteudos).csv` → label `Libro`).
- `Template_recorrencia` — *optional*: schedule rows for biometric parameters and content plans
- `Template_conteudos` — educational content plan config + content items

The tool groups files automatically by matching the common prefix before `(SheetType)`.

`Template_parametros` and `Novos_parametros` are now decoupled:
- `Template_parametros` always drives `TemplateBiometricParameter` inserts.
- `Novos_parametros` drives `ClinicalDataType` inserts only. If a parameter is new, it must appear in **both** files (defined in `Novos_parametros`, then linked to the template via `Template_parametros`).

### File: Programa CSV

| Column       | Description                  | Example           |
|-------------|------------------------------|--------------------|
| Programa    | Program display name         | Reabilitação Vocal |
| partilhavel | Shareable flag (sim/não)     | sim                |
| code        | Unique program code          | VOCAL-REHAB        |

Single data row (row 0 = headers, row 1 = data).

### File: Template_parametros CSV

| # | Column                  | Description                              | Example                |
|---|-------------------------|------------------------------------------|------------------------|
| 0 | Programa                | Program display name (unused)            | Reabilitação Vocal     |
| 1 | Tipo de prescrição      | Prescription type filter                 | Parâmetro biométrico   |
| 2 | Prescrição              | Parameter display name                   | Saturação de oxigénio  |
| 3 | Code                    | Unique parameter code                    | PEROXYSAT              |
| 4 | Modo de medição         | Measurement mode (Automática/Manual)     | Automática             |
| 5 | Dispositivo             | Device name (optional)                   | Mola IHealth           |
| 6 | Dispositivo code        | Device code (optional)                   | IHEALTHOXIMETER        |
| 7 | Monitorização recorrente| Recurring monitoring flag (unused)       | Sim                    |
| 8 | Duração                 | Duration in days                         | 365                    |

- The file may begin with empty rows; the parser locates rows by `Code` (column 3).
- Empty rows (no Code) are skipped, as is the header row itself.
- Only rows whose `Tipo de prescrição` contains `biom` after accent/encoding normalization are emitted (questionnaires, exercises and content rows are ignored).
- Drives `TemplateBiometricParameter` inserts in `02-Template.sql`. The schedule (period + week days + timers) for each parameter comes from a row in `Template_recorrencia` with the same `Code`.

### File: Novos_parametros CSV

| # | Column            | Description                          | Example             |
|---|-------------------|--------------------------------------|---------------------|
| 0 | Nome do parametro | Parameter display name               | Reforço hidríco     |
| 1 | Code              | Unique parameter code                | WATERREINFORCE      |
| 2 | ShortDescription  | Short description                    | Reforço hidríco     |
| 3 | Categoria         | Category name                        | Composição corporal |
| 4 | Categoria code    | Category code                        | COMPCORP            |
| 5 | Casa Decimal      | Decimal precision                    | 2                   |
| 6 | MinValue          | Minimum value                        | 0                   |
| 7 | MaxValue          | Maximum value                        | 5000                |
| 8 | Incremento        | Increment step                       | 10                  |
| 9 | Unidad de medida  | Measurement unit                     | ml                  |
| 10| Chart Increment   | Chart increment value                | 200                 |

- Row 0 = headers, rows 1+ = data.
- Empty rows (no Code in column 1) are skipped.
- Drives `ClinicalDataType` inserts in `01-BP.sql`. Empty data columns become `NULL` in the SQL.

### File: Novos_exercicios CSV

The CSV has multiple physical lines per logical row (multi-line cells inside double quotes); the parser handles `""` escaping and embedded newlines. The file may also have a top group-header row above the actual column header — the parser locates the header row by looking for a row that contains `Nome` plus `Objetivo` and/or `Instruções`.

Columns are looked up by header name (accent/case-insensitive, all match prefixes):

| Logical column   | Accepted headers                                            | Required | Falls back to |
|------------------|-------------------------------------------------------------|----------|---------------|
| Nome / name      | `Nome`, `Nome do exercício`, `name`                         | yes      | —             |
| Code             | `Code`, `código`                                            | no       | derived from name (uppercase, `_`-separated, accent-stripped) |
| ShortName        | `ShortName`, `Short name`, `Nome curto`, `ShortDescription` | no       | name          |
| Objetivo         | `Objetivo…`, `Objective…`                                   | no       | `NULL`        |
| Instruções       | `Instruções…`, `Instrucoes…`, `Instructions…`               | no       | `NULL`        |

- Multi-line text in cells (e.g. instructions split across lines) is collapsed to a single line of whitespace before going into SQL.
- Drives `PRePhysicalExercise` inserts in `01-PRE.sql`.

### File: Novos_conteudos CSV

| # | Column            | Description                              | Example             |
|---|-------------------|------------------------------------------|---------------------|
| 0 | ordem             | Order (used for `[Order]`)               | 3                   |
| 1 | Nome do conteudo  | Display title                            | Conhecer a importância da medicação |
| 2 | code              | Unique catalog code                      | PCAA_1.19           |
| 3 | Categoria         | Category name (just informational)       | Conhecimento Sobre a Diabetes |
| 4 | Category code     | Category lookup code                     | DIABETES_KNOWLEDGE  |
| 5 | Descrição         | Description                              | A diabetes é uma doença crónica… |
| 6 | Objetivo          | Objective                                | Aumentar o conhecimento sobre a diabetes |

- Row 0 = headers, rows 1+ = data.
- Empty rows (no `code` in column 2) are skipped.
- Description and Objective may be quoted multi-line cells — newlines are collapsed to single spaces.
- Drives `EducationalContent.[Item]` inserts in `01-Content.sql`. The CategoryId is resolved at execution time via a subquery on `[EducationalContent].[Category].[Code]`.

### File: Template_recorrencia CSV

Used to extract **biometric schedule rows** for `02-Template.sql` and **content plan rows** for `03-Conteudos.sql`. Questionnaire and exercise rows are ignored for now.

Header columns: `Programa;Tipo de prescrição;Prescrição;Code;Modo de medição;Dispositivo;Dispositivo code;Monitorização recorrente;Duração;Configuração datas e horas;Período a monitorizar;Periodo code;Seg;Ter;Qua;Qui;Sex;Sab;Dom;Conteudos por dia`

| #  | Column                   | Description                                                | Example         |
|----|--------------------------|------------------------------------------------------------|-----------------|
| 0  | Programa                 | Program display name (unused)                              | Reabilitação Vocal |
| 1  | Tipo de prescrição       | Row classifier (lenient substring match, see below)        | Parâmetro biométrico |
| 2  | Prescrição               | Display name (parameter name, plan description, …)         | Saúde Vocal     |
| 3  | Code                     | Parameter code (biometric rows only)                       | HEARTRATE       |
| 7  | Monitorização recorrente | If `Sim`, schedule rows are emitted for biometric          | Sim             |
| 8  | Duração                  | Days (used for content plans)                              | 182             |
| 11 | Periodo code             | Code emitted into `TemplateBiometricParameterPeriod.Code`  | DURING_EXERCISE |
| 12 | Seg                      | Monday timer(s), `HH:MM` or `HH:MM/HH:MM`                  | 19:00/22:00     |
| 13 | Ter                      | Tuesday                                                    | 19:00           |
| 14 | Qua                      | Wednesday                                                  | 19:00           |
| 15 | Qui                      | Thursday                                                   | 19:00           |
| 16 | Sex                      | Friday                                                     | 19:00           |
| 17 | Sab                      | Saturday                                                   | 19:00           |
| 18 | Dom                      | Sunday                                                     | 19:00           |
| 19 | Conteudos por dia        | Contents delivered per day (content plans)                 | 2               |

- A row is treated as **biometric** when col 1 normalizes to a string containing `biom`. It must also have a non-empty `Code` (col 3) and `Monitorização recorrente = Sim` to produce schedule inserts.
- A row is treated as a **content plan** when col 1 contains `conte`. The plan description is col 2, duration is col 8, contents-per-day is col 19.
- `Seg…Dom` (cols 12–18) map to `DayNumber` 1–7. Multiple times in the same cell are split by `/`. Cells without a recognizable `HH:MM` token are skipped.

### File: Template_conteudos CSV

Single table; row 0 = header, rows 1+ = data.

| # | Column           | Description                              | Example                 |
|---|------------------|------------------------------------------|-------------------------|
| 0 | _(row number)_   | Sequential order / itemNumber            | 1                       |
| 1 | Nome do conteúdo | Content display name                     | Encontrar o osso hioide |
| 2 | ID interno       | Internal content code                    | SV_PC_C1                |
| 3 | Preplano         | Plan description this item belongs to    | Saúde Vocal             |

- Rows without a code in column 2 are skipped.
- `Preplano` must match the `Prescrição` value of a row in `Template_recorrencia` so the item insert can resolve `[Description] = '{preplano}'` at run time. Mismatched preplanos generate SQL that resolves to `NULL` for `PlanId`.

---

## SQL Output

### Output Directory

Generated files are written to `output/`:
- `{ProgramLabel}_01-BP.sql` — new biometric parameters (catalog)
- `{ProgramLabel}_01-PRE.sql` — new physical exercises (catalog)
- `{Label}_01-Content.sql` — new educational content items (catalog). `{Label}` comes from the conteudos CSV's own filename, not the program's prefix.
- `{ProgramLabel}_02-Template.sql` — template + biometric parameters + schedules
- `{ProgramLabel}_03-Conteudos.sql` — template educational content plans + items

The full-generation flow emits files in this order: 01-BP → 01-PRE → 01-Content → 02-Template → 03-Conteudos. The conteudos catalog is global, so it's emitted only once (during the first program iteration) regardless of how many programs are processed.

When running the generated SQL by hand, run them in dependency order: catalog inserts (01-BP, 01-PRE, 01-Content) first, then the template (02), then the plans/items (03).

### 01-Content.sql — New Educational Content Items

Only generated when a `Novos_conteudos` CSV is present and contains at least one row. Contains `EducationalContent.[Item]` INSERTs for items in the catalog.

Table: `[EducationalContent].[Item]`

| Field                | Source / Value                                                                |
|----------------------|-------------------------------------------------------------------------------|
| Id                   | `NEWID()`                                                                     |
| Title                | Novos_conteudos → `Nome do conteudo`                                          |
| Code                 | Novos_conteudos → `code`                                                      |
| CategoryId           | `(SELECT [Id] FROM [EducationalContent].[Category] WHERE [Code] = '{Category code}')`, or `NULL` if Category code is blank |
| Description          | Novos_conteudos → `Descrição`, or `NULL` if blank                             |
| ImageURL             | Always `NULL`                                                                 |
| IsActive             | Always `1`                                                                    |
| CreateDateTime       | `SYSDATETIME()`                                                               |
| ModifyDateTime       | Always `NULL`                                                                 |
| Objective            | Novos_conteudos → `Objetivo`, or `NULL` if blank                              |
| Order                | Novos_conteudos → `ordem`, falling back to row index                          |
| CreateDateTimeOld    | `SYSDATETIME()`                                                               |
| ModifyDateTimeOld    | Always `NULL`                                                                 |

- Each INSERT is separated by `GO`.
- Newlines inside cell values are collapsed to single spaces.

### 01-PRE.sql — New Physical Exercises

Only generated when a `Novos_exercicios` CSV is present and contains at least one row. Contains `PRePhysicalExercise` INSERTs for new exercises in the catalog.

Table: `[dbo].[PRePhysicalExercise]`

| Field                  | Source / Value                                                                |
|------------------------|-------------------------------------------------------------------------------|
| Id                     | `NEWID()`                                                                     |
| Code                   | Novos_exercicios → `Code` column, or derived from name if absent              |
| Description            | Novos_exercicios → `Nome` column                                              |
| ShortDescription       | Novos_exercicios → `ShortName`, or `Nome` if missing                          |
| Image / ImagePath      | Always `NULL`                                                                 |
| IsActive               | Always `1`                                                                    |
| CreateBy / ModifyBy    | Always `'00000000-0000-0000-0000-000000000000'`                               |
| CreateDateTime / ModifyDateTime | `SYSDATETIME()`                                                      |
| Order                  | Sequential (1, 2, 3, …) within the file                                       |
| Objective              | Novos_exercicios → `Objetivo`, or `NULL` if column absent/empty               |
| Instructions           | Novos_exercicios → `Instruções`, or `NULL` if column absent/empty             |
| ImageURL / IconURL     | Always `NULL`                                                                 |
| CreateDateTimeOld / ModifyDateTimeOld | Always `NULL`                                                  |

- Each INSERT is separated by `GO`.
- Newlines inside cell values are collapsed to single spaces.

### 01-BP.sql — New Biometric Parameters

Only generated when a `Novos_parametros` CSV is present and contains at least one row. Contains `ClinicalDataType` INSERTs for new biometric parameters that don't yet exist in the database.

Table: `[dbo].[ClinicalDataType]`

| Field                   | Source / Value                                         |
|-------------------------|--------------------------------------------------------|
| Id                      | `NEWID()`                                              |
| Code                    | Novos_parametros → `Code`                              |
| Loinc                   | Always `NULL`                                          |
| Snomed                  | Always `NULL`                                          |
| Description             | Novos_parametros → `Nome do conteúdo`                  |
| ClinicalDataCategoryId  | Subquery: `SELECT Id FROM ClinicalDataCategory WHERE Code = '{categoryCode}'` |
| DataType                | `'DECIMAL'` if Decimal column has value, else `'INTEGER'` |
| MinValue                | `CAST(x AS Decimal(19, 6))` from CSV, or `NULL`       |
| MaxValue                | `CAST(x AS Decimal(19, 6))` from CSV, or `NULL`       |
| IncrementValue          | `CAST(x AS Decimal(19, 6))` from CSV, or `NULL`       |
| ValueMask               | Always `NULL`                                          |
| Order                   | Sequential (1, 2, 3...) among new parameters           |
| AggregationCode         | Always `NULL`                                          |
| Formula                 | Always `NULL`                                          |
| IsCrossSectionalData    | Always `0`                                             |
| IsActive                | Always `1`                                             |
| MeasurementUnit         | Novos_parametros → `Unidad de medida`, or `NULL`       |
| ShortDescription        | Novos_parametros → `ShortDesc`, or `NULL`              |
| ChartIncrementValue     | `CAST(x AS Decimal(19, 6))` from CSV, or `NULL`       |
| ChartIncrementPrecision | Always `NULL`                                          |
| IsChart                 | Always `NULL`                                          |
| ClinicalDataTypeGroupId | Always `NULL`                                          |
| ValuePrecision          | Novos_parametros → `Decimal` column value, or `0`      |

- Each INSERT is separated by `GO`.

### 02-Template.sql — Template + Biometric Parameters + Schedules

Contains the program template, then per biometric parameter: the parameter row, optionally a period row, and optionally a week-day row + timer rows for each populated weekday.

#### 1. Template INSERT (one per program)

Table: `[dbo].[Template]`

| Field           | Source / Value                                |
|-----------------|-----------------------------------------------|
| Id              | `NEWID()`                                     |
| Name            | Programa CSV → `Programa` column              |
| IsShareable     | Programa CSV → `partilhavel` (sim=1, não=0)   |
| IsActive        | Always `1`                                    |
| CreateBy        | Always `'00000000-0000-0000-0000-000000000000'` |
| CreateDateTime  | `SYSDATETIMEOFFSET()`                         |
| ProgramCode     | Programa CSV → `code` column                  |

#### 2. TemplateBiometricParameter INSERTs (one per parameter row)

Table: `[dbo].[TemplateBiometricParameter]`

| Field                    | Source / Value                                |
|--------------------------|-----------------------------------------------|
| Id                       | `NEWID()`                                     |
| Code                     | Parameters CSV → `Code` column                |
| Snomed                   | Always `''`                                   |
| CodeDataEntry            | Always `''`                                   |
| IsRecurringMonitoring    | Always `1`                                    |
| IsActive                 | Always `1`                                    |
| TemplateId               | Subquery: `SELECT Id FROM Template WHERE ProgramCode = '{code}'` |
| DurationInDays           | Parameters CSV → `Duração (dias)` column      |
| ProgramCode              | Programa CSV → `code` column                  |
| ReceiveUnfulfilledAlerts | Always `0`                                    |
| AssessmentToolCode       | Parameters CSV → `Dispositivo Code` (or `null` if empty) |

- Each parameter block is preceded by `GO` and a section comment header.
- All rows in `Template_parametros` generate a TemplateBiometricParameter INSERT. Period and week-day inserts only follow when the matching `Template_recorrencia` row has `Monitorização recorrente = Sim`.

#### 3. TemplateBiometricParameterPeriod INSERT (one per recurring parameter, when `Periodo code` is set)

Table: `[dbo].[TemplateBiometricParameterPeriod]`

| Field                          | Source / Value                                                        |
|--------------------------------|-----------------------------------------------------------------------|
| Id                             | `NEWID()`                                                             |
| Code                           | Recorrencia → `Periodo code` (col 11), e.g. `DURING_EXERCISE`         |
| TemplateBiometricParameterId   | Subquery: TBP by `Code` + `TemplateId` (TemplateId resolved via `ProgramCode`) |
| IsActive                       | Always `1`                                                            |

#### 4. TemplateBiometricParameterWeekDay INSERT (one per weekday with at least one valid time)

Table: `[dbo].[TemplateBiometricParameterWeekDay]`

| Field                          | Source / Value                                                        |
|--------------------------------|-----------------------------------------------------------------------|
| Id                             | `NEWID()`                                                             |
| TemplateBiometricParameterId   | Same TBP lookup as the period insert                                  |
| DayNumber                      | 1=Seg … 7=Dom                                                         |
| IsActive                       | Always `1`                                                            |

#### 5. TemplateBiometricParameterWeekDayTimer INSERTs (one per slash-separated time)

Table: `[dbo].[TemplateBiometricParameterWeekDayTimer]`

| Field                              | Source / Value                                                                                |
|------------------------------------|-----------------------------------------------------------------------------------------------|
| Id                                 | `NEWID()`                                                                                     |
| TemplateBiometricParameterWeekDayId| Subquery: WeekDay row matched by `DayNumber` + the same TBP lookup                            |
| WeekDayStartTime                   | `'2026-01-01 HH:MM:00.0000000 +00:00'` — date is a fixed placeholder, only the HH:MM matters  |
| IsActive                           | Always `1`                                                                                    |

### 03-Conteudos.sql — Educational Content Plans + Items

Generated only when **both** `Template_recorrencia` and `Template_conteudos` CSVs are present. Contains two types of INSERTs:

#### 1. TemplateEducationalContentPlan INSERTs (one per content row in `Template_recorrencia`)

Table: `[dbo].[TemplateEducationalContentPlan]`

| Field              | Source / Value                                              |
|--------------------|-------------------------------------------------------------|
| Id                 | `NEWID()`                                                   |
| TemplateId         | Subquery: `SELECT Id FROM Template WHERE ProgramCode = '{code}'` |
| Description        | Recorrencia CSV → `Prescrição` (col 2)                      |
| DurationInDays     | Recorrencia CSV → `Duração` (col 8)                         |
| ContentPerDay      | Recorrencia CSV → `Conteudos por dia` (col 18)              |
| IsOrderMandatory   | Always `1`                                                  |
| IsActive           | Always `1`                                                  |
| ProgramCode        | Programa CSV → `code` column                                |

A program may have multiple plans — one row per `Tipo de prescrição` starting with `Conteúdos`/`Conteudos` produces one INSERT.

#### 2. TemplateEducationalContentItem INSERTs (one per content row in `Template_conteudos`)

Table: `[dbo].[TemplateEducationalContentItem]`

| Field       | Source / Value                                              |
|-------------|-------------------------------------------------------------|
| Id          | `NEWID()`                                                   |
| PlanId      | Subquery: `SELECT Id FROM TemplateEducationalContentPlan WHERE ProgramCode = '{code}' AND Description = '{preplano}'` |
| Code        | Conteudos CSV → `ID interno` column                         |
| ItemNumber  | Conteudos CSV → row number (as string: `'1'`, `'2'`, ...)   |
| IsActive    | Always `1`                                                  |

- The `Preplano` column in `Template_conteudos` must match a `Prescrição` value in `Template_recorrencia` for the lookup to resolve at run time.
- No `GO` separator between content item INSERTs.

---

## Parameter Classification

A parameter generates output based on which CSV(s) it appears in:

| Where it appears                            | Generates                                          |
|---------------------------------------------|----------------------------------------------------|
| Template_parametros only                    | TemplateBiometricParameter (02-Template.sql)       |
| Novos_parametros only                       | ClinicalDataType (01-BP.sql)                       |
| Both Template_parametros and Novos_parametros | ClinicalDataType + TemplateBiometricParameter    |

- **Automatic** parameters (with a `Dispositivo Code`) link to physical devices and typically already exist as ClinicalDataTypes — they only need to be in `Template_parametros`.
- **New manual** parameters must be added to `Novos_parametros` so a `ClinicalDataType` is created, and to `Template_parametros` so the template links to it.

---

## Running the Tool

```bash
npm run generate
```

This executes `tsx src/index.ts`, which presents an interactive menu:

```
=== Template Generator ===

  1) Crear nuevos parámetros biométricos (solo 01-BP.sql)
  2) Crear nuevos exercicios (solo 01-PRE.sql)
  3) Crear nuevos conteudos (solo 01-Content.sql)
  4) Generar template completo (01-BP + 01-PRE + 01-Content + 02-Template + 03-Conteudos)
  q) Salir
```

- **Option 1** scans `csv/` for `Novos_parametros` files and generates only `01-BP.sql`. No `Programa` CSV is required.
- **Option 2** scans `csv/` for `Novos_exercicios` files and generates only `01-PRE.sql`. No `Programa` CSV is required.
- **Option 3** scans `csv/` for `Novos_conteudos` files and generates only `01-Content.sql`. No `Programa` CSV is required.
- **Option 4** scans `csv/` for full CSV groups (anchored on `Programa`) and generates everything in execution order: `01-BP.sql` (if `Novos_parametros` exists), `01-PRE.sql` (if `Novos_exercicios` exists), `01-Content.sql` (if any `Novos_conteudos` exists; emitted once before any program's template), `02-Template.sql`, and `03-Conteudos.sql` (if both `Template_recorrencia` and `Template_conteudos` exist).

---

## Project Structure

```
templateGenerator/
├── csv/               # Input CSV files (read-only, never modified)
├── script/            # Reference SQL examples (manual, for comparison)
├── output/            # Generated SQL output (gitignored)
├── src/
│   ├── index.ts       # CLI entry point — discovers CSVs, orchestrates generation
│   ├── csvParser.ts   # Parses semicolon-separated latin1 CSVs into typed objects
│   ├── sqlGenerators.ts # Generates all SQL output (BP, Template, Conteudos)
│   └── types.ts       # ProgramData, TemplateParameter, NewParameter, ContentPlanConfig, EducationalContentItem
├── package.json
├── tsconfig.json
└── rules.md           # This file
```
