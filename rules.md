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

CSV files are exported from Excel on Windows and are encoded in **Windows-1252 (latin1)**. They contain Portuguese characters (ã, ç, é, ú, etc.). Read them with `latin1` encoding in Node.js.

### Separator

All CSVs use **semicolon (`;`)** as the column separator.

### File Naming Convention

CSVs follow this naming pattern:

```
TabelaTemplatesProgramas_{ProgramName}({SheetType}).csv
```

Where `{SheetType}` is one of:
- `Programa` — program-level data (one row)
- `Template_parametros` — biometric parameters (multiple rows)
- `Template_conteudos` — educational content plan config + content items

The tool groups files automatically by matching the common prefix before `(SheetType)`.

### File: Programa CSV

| Column       | Description                  | Example           |
|-------------|------------------------------|--------------------|
| Programa    | Program display name         | Reabilitação Vocal |
| partilhavel | Shareable flag (sim/não)     | sim                |
| code        | Unique program code          | VOCAL-REHAB        |

Single data row (row 0 = headers, row 1 = data).

### File: Template_parametros CSV

| # | Column            | Description                          | Example          |
|---|-------------------|--------------------------------------|------------------|
| 0 | _(row number)_    | Sequential order                     | 1                |
| 1 | Nome do conteúdo  | Parameter display name               | Saturação de oxigénio |
| 2 | Code              | Unique parameter code                | PEROXYSAT        |
| 3 | Modo de medição   | Measurement mode (Automatica/Manual) | Automatica       |
| 4 | Dispositivo       | Device name (optional)               | Mola IHealth     |
| 5 | Dispositivo Code  | Device code (optional)               | IHEALTHOXIMETER  |
| 6 | Duração (dias)    | Duration in days                     | 365              |
| 7 | New               | Is this a new clinical data type? (Sim/empty) | Sim       |
| 8 | ShortDesc         | Short description (for new params)   | Reforço Hídrico  |
| 9 | Categoria         | Category name (for new params)       | Composição corporal |
| 10| Categoria Code    | Category code (for new params)       | COMPCORP         |
| 11| Decimal           | Decimal precision (for new params)   | 2                |
| 12| MinValue          | Minimum value (for new params)       | 0                |
| 13| MaxValue          | Maximum value (for new params)       | 5000             |
| 14| Incremento        | Increment step (for new params)      | 10               |
| 15| Unidad de medida  | Measurement unit (for new params)    | ml               |
| 16| Chart Increment   | Chart increment value (for new params)| 200             |

- Row 0 = headers, rows 1+ = data.
- Empty rows (no Code in column 2) are skipped.
- Columns 8-16 are only relevant when column 7 (New) = "Sim".

### File: Template_conteudos CSV

This file contains **two tables** separated by an empty row:

**Table 1 — Plan configuration (rows 0-1):**

| Column            | Description              | Example |
|-------------------|--------------------------|---------|
| duracao           | Plan duration in days    | 365     |
| conteudos por dia | Contents delivered per day | 2     |

**Table 2 — Content items (row 3 = header, rows 4+):**

| # | Column           | Description                              | Example       |
|---|------------------|------------------------------------------|---------------|
| 0 | _(row number)_   | Sequential order / itemNumber            | 1             |
| 1 | Nome do conteúdo | Content display name                     | Encontrar o osso hioide |
| 2 | ID interno       | Internal content code                    | SV_PC_C1      |
| 3 | Optional         | Is optional? (sim/true/1 = yes, empty = no) | sim        |

- The parser locates the items header by searching for the row containing "ID interno".
- Rows without a code in column 2 are skipped.
- Truthy values for Optional: `sim`, `true`, `1` (case-insensitive).

---

## SQL Output

### Output Directory

Generated files are written to `output/` with numbered naming: `{ProgramLabel}_01-BP.sql`, `{ProgramLabel}_02-Template.sql`, `{ProgramLabel}_03-Conteudos.sql`.

The execution order matters — scripts must be run in numeric order (01 → 02 → 03) because later scripts reference records created by earlier ones.

### 01-BP.sql — New Biometric Parameters

Only generated when at least one parameter has `New = Sim`. Contains ClinicalDataType INSERTs for new biometric parameters that don't yet exist in the database.

Table: `[dbo].[ClinicalDataType]`

| Field                   | Source / Value                                         |
|-------------------------|--------------------------------------------------------|
| Id                      | `NEWID()`                                              |
| Code                    | Parameters CSV → `Code`                                |
| Loinc                   | Always `NULL`                                          |
| Snomed                  | Always `NULL`                                          |
| Description             | Parameters CSV → `Nome do conteúdo`                    |
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
| MeasurementUnit         | Parameters CSV → `Unidad de medida`, or `NULL`         |
| ShortDescription        | Parameters CSV → `ShortDesc`, or `NULL`                |
| ChartIncrementValue     | `CAST(x AS Decimal(19, 6))` from CSV, or `NULL`       |
| ChartIncrementPrecision | Always `NULL`                                          |
| IsChart                 | Always `NULL`                                          |
| ClinicalDataTypeGroupId | Always `NULL`                                          |
| ValuePrecision          | Parameters CSV → `Decimal` column value, or `0`        |

- Each INSERT is separated by `GO`.

### 02-Template.sql — Template + Biometric Parameters

Contains two types of INSERTs:

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

- Each INSERT is separated by `GO`.
- **All parameter rows** generate a TemplateBiometricParameter INSERT regardless of the `New` flag.

### 03-Conteudos.sql — Educational Content Plan + Items

Contains two types of INSERTs:

#### 1. TemplateEducationalContentPlan INSERT (one per program)

Table: `[dbo].[TemplateEducationalContentPlan]`

| Field              | Source / Value                                              |
|--------------------|-------------------------------------------------------------|
| Id                 | `NEWID()`                                                   |
| TemplateId         | Subquery: `SELECT Id FROM Template WHERE ProgramCode = '{code}'` |
| Description        | `'Pack Standard {ProgramCode}'`                             |
| DurationInDays     | Conteudos CSV → Table 1 → `duracao`                        |
| ContentPerDay      | Conteudos CSV → Table 1 → `conteudos por dia`              |
| IsOrderMandatory   | Always `1`                                                  |
| IsActive           | Always `1`                                                  |
| ProgramCode        | Programa CSV → `code` column                                |

#### 2. TemplateEducationalContentItem INSERTs (one per content row)

Table: `[dbo].[TemplateEducationalContentItem]`

| Field       | Source / Value                                              |
|-------------|-------------------------------------------------------------|
| Id          | `NEWID()`                                                   |
| PlanId      | Subquery: `SELECT Id FROM TemplateEducationalContentPlan WHERE ProgramCode = '{code}'` |
| Code        | Conteudos CSV → `ID interno` column                        |
| ItemNumber  | Conteudos CSV → row number (as string: `'1'`, `'2'`, ...)  |
| IsOptional  | Conteudos CSV → `Optional` column (sim/true/1 = `1`, empty = `0`) |

- No `GO` separator between content item INSERTs.

---

## Parameter Classification

| Measurement Mode | Device Code | New  | Generates                          |
|-----------------|-------------|------|------------------------------------|
| Automatica      | Present     | No   | TemplateBiometricParameter only    |
| Manual          | Empty       | Sim  | TemplateBiometricParameter + ClinicalDataType (BP) |
| Manual          | Empty       | No   | TemplateBiometricParameter only    |

- **Automatic** parameters are linked to physical devices (oximeters, etc.) and already exist as ClinicalDataTypes in the database.
- **New manual** parameters need a ClinicalDataType INSERT (01-BP.sql) because they don't exist yet.

---

## Running the Tool

```bash
npm run generate
```

This executes `tsx src/index.ts`, which:
1. Scans `csv/` for CSV file groups (Programa + Template_parametros + Template_conteudos)
2. Parses each group
3. Generates numbered SQL files into `output/`

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
│   └── types.ts       # ProgramData, TemplateParameter, ContentPlanConfig, EducationalContentItem
├── package.json
├── tsconfig.json
└── rules.md           # This file
```
