import type { ProgramData, TemplateParameter, ContentPlanConfig, EducationalContentItem } from "./types.js";

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function formatDecimal(value: number): string {
  return `CAST(${value} AS Decimal(19, 6))`;
}

// -- Template INSERT -----------------------------------------------------------

function generateTemplateInsert(program: ProgramData): string {
  return `INSERT INTO [dbo].[Template] ([Id] ,[Name] ,[IsShareable] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ProgramCode])
VALUES (
    NEWID() --id
    ,${sqlString(program.name)} --name
    ,${program.isShareable ? 1 : 0} --isShareable
    ,1 --isActive
    ,'00000000-0000-0000-0000-000000000000' --createBy
    ,SYSDATETIMEOFFSET() --createDateTime
    ,${sqlString(program.code)} --programCode
    );`;
}

// -- TemplateBiometricParameter INSERT ----------------------------------------

function generateBiometricParameterInsert(
  param: TemplateParameter,
  programCode: string
): string {
  const assessmentToolCode = param.deviceCode
    ? sqlString(param.deviceCode)
    : "null";

  return `INSERT INTO [dbo].[TemplateBiometricParameter] ([Id] ,[Code] ,[Snomed] ,[CodeDataEntry] ,[IsRecurringMonitoring] ,[IsActive] ,[TemplateId] ,[DurationInDays] ,[ProgramCode] ,[ReceiveUnfulfilledAlerts], [AssessmentToolCode])
VALUES
(
    NEWID() --id
    ,${sqlString(param.code)} --code
    ,'' --snomed
    ,'' --codeDataEntry
    ,1 --isRecurringMonitoring
    ,1 --isActive
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${sqlString(programCode)}) --templateId
    ,${param.durationDays} --durationInDays
    ,${sqlString(programCode)} --programCode
    ,0 --receiveUnfulfilledAlerts
    ,${assessmentToolCode} --AssessmentToolCode
);`;
}

// -- ClinicalDataType INSERT (BP) ---------------------------------------------

function generateClinicalDataTypeInsert(
  param: TemplateParameter,
  order: number
): string {
  const categoryLookup = param.categoryCode
    ? `(SELECT [Id] FROM [dbo].[ClinicalDataCategory] WHERE [Code] = ${sqlString(param.categoryCode)})`
    : "NULL";

  const dataType = param.decimalPrecision != null ? "DECIMAL" : "INTEGER";

  return `INSERT INTO [dbo].[ClinicalDataType]
([Id], [Code], [Loinc], [Snomed], [Description], [ClinicalDataCategoryId], [DataType], [MinValue], [MaxValue], [IncrementValue], [ValueMask], [Order], [AggregationCode], [Formula], [IsCrossSectionalData], [IsActive], [MeasurementUnit], [ShortDescription], [ChartIncrementValue], [ChartIncrementPrecision], [IsChart], [ClinicalDataTypeGroupId], [ValuePrecision])
VALUES (
    NEWID(),    -- Id
    ${sqlString(param.code)},                                   -- Code
    NULL,                                       -- Loinc
    NULL,                                       -- Snomed
    ${sqlString(param.name)},                                    -- Description
    ${categoryLookup},    -- ClinicalDataCategoryId
    '${dataType}',                              -- DataType
    ${param.minValue != null ? formatDecimal(param.minValue) : "NULL"},           -- MinValue
    ${param.maxValue != null ? formatDecimal(param.maxValue) : "NULL"},         -- MaxValue
    ${param.increment != null ? formatDecimal(param.increment) : "NULL"},           -- IncrementValue
    NULL,                                       -- ValueMask
    ${order},                                         -- Order
    NULL,                                       -- AggregationCode
    NULL,                                       -- Formula
    0,                                          -- IsCrossSectionalData
    1,                                          -- IsActive
    ${param.measurementUnit ? sqlString(param.measurementUnit) : "NULL"},                                       -- MeasurementUnit
    ${param.shortDescription ? sqlString(param.shortDescription) : "NULL"},                                       -- ShortDescription
    ${param.chartIncrement != null ? formatDecimal(param.chartIncrement) : "NULL"},           -- ChartIncrementValue
    NULL,                                       -- ChartIncrementPrecision
    NULL,                                       -- IsChart
    NULL,                                       -- ClinicalDataTypeGroupId
    ${param.decimalPrecision ?? 0}                                           -- ValuePrecision
);`;
}

// -- Public API ---------------------------------------------------------------

export function generateTemplateSql(
  program: ProgramData,
  parameters: TemplateParameter[]
): string {
  const lines: string[] = [
    `-- =============================================`,
    `-- Template: ${program.name} (${program.code})`,
    `-- =============================================`,
    ``,
    generateTemplateInsert(program),
  ];

  for (const param of parameters) {
    lines.push("", "GO");
    lines.push(generateBiometricParameterInsert(param, program.code));
  }

  lines.push("");
  return lines.join("\n");
}

export function generateBpSql(
  parameters: TemplateParameter[]
): string | null {
  const newParams = parameters.filter((p) => p.isNew);
  if (newParams.length === 0) return null;

  const lines: string[] = [
    `-- =============================================`,
    `-- New Biometric Parameters (ClinicalDataType)`,
    `-- =============================================`,
  ];

  newParams.forEach((param, index) => {
    if (index > 0) lines.push("", "GO");
    lines.push("", generateClinicalDataTypeInsert(param, index + 1));
  });

  lines.push("", "GO", "");
  return lines.join("\n");
}

// -- TemplateEducationalContentPlan INSERT ------------------------------------

function generateEducationalContentPlanInsert(
  programCode: string,
  config: ContentPlanConfig
): string {
  return `INSERT INTO [dbo].[TemplateEducationalContentPlan] ([Id] ,[TemplateId] ,[Description], [DurationInDays] ,[ContentPerDay] ,[IsOrderMandatory] ,[IsActive], [ProgramCode])
VALUES (NEWID() --id
, (SELECT [Id] FROM [Template] WHERE [ProgramCode] = ${sqlString(programCode)}) --templateId
, 'Pack Standard ${programCode}' --description
 ,${config.durationDays} --durationInDays
 ,${config.contentsPerDay} --contentPerDay
 ,1 --isOrderMandatory
 ,1 --isActive
 , ${sqlString(programCode)} --programCode
 );`;
}

// -- TemplateEducationalContentItem INSERT ------------------------------------

function generateEducationalContentItemInsert(
  item: EducationalContentItem,
  programCode: string
): string {
  return `INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = ${sqlString(programCode)}) --planId
    ,${sqlString(item.code)} --code
    ,'${item.order}' --itemNumber
    ,${item.isOptional ? 1 : 0} --isOptional
    );`;
}

// -- 03-Conteudos.sql ---------------------------------------------------------

export function generateConteudosSql(
  programCode: string,
  config: ContentPlanConfig,
  items: EducationalContentItem[]
): string {
  const lines: string[] = [
    `-- =============================================`,
    `-- Educational Content Plan (${programCode})`,
    `-- =============================================`,
    ``,
    generateEducationalContentPlanInsert(programCode, config),
  ];

  for (const item of items) {
    lines.push("", generateEducationalContentItemInsert(item, programCode));
  }

  lines.push("");
  return lines.join("\n");
}
