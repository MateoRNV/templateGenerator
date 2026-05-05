import type { ProgramData, TemplateParameter, NewParameter, NewExercise, NewContent, BiometricSchedule, ContentPlan, EducationalContentItem } from "./types.js";

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

// -- TemplateBiometricParameterPeriod INSERT ----------------------------------

function tbpLookup(parameterCode: string, programCode: string): string {
  return `(SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = ${sqlString(parameterCode)} AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${sqlString(programCode)}))`;
}

function generateBiometricPeriodInsert(
  parameterCode: string,
  periodCode: string,
  programCode: string
): string {
  return `INSERT INTO [dbo].[TemplateBiometricParameterPeriod] ([Id] ,[Code] ,[TemplateBiometricParameterId] ,[IsActive])
VALUES (
    NEWID() --id
    ,${sqlString(periodCode)} --code
    ,${tbpLookup(parameterCode, programCode)} --templateBiometricParameterId
    ,1 --isActive
    );`;
}

// -- TemplateBiometricParameterWeekDay INSERT ---------------------------------

function generateBiometricWeekDayInsert(
  parameterCode: string,
  dayNumber: number,
  programCode: string
): string {
  return `INSERT INTO [dbo].[TemplateBiometricParameterWeekDay] ([Id] ,[TemplateBiometricParameterId] ,[DayNumber] ,[IsActive])
VALUES (
    NEWID() --id
    ,${tbpLookup(parameterCode, programCode)} --templateBiometricParameterId
    ,${dayNumber} --dayNumber
    ,1 --isActive
    );`;
}

// -- TemplateBiometricParameterWeekDayTimer INSERT ----------------------------

function formatWeekDayStartTime(time: string): string {
  return `'2026-01-01 ${time}:00.0000000 +00:00'`;
}

function generateBiometricWeekDayTimerInsert(
  parameterCode: string,
  dayNumber: number,
  time: string,
  programCode: string
): string {
  const tbpwLookup = `(SELECT [Id] FROM [TemplateBiometricParameterWeekDay] [TBPW] WHERE [TBPW].[DayNumber] = ${dayNumber} AND [TBPW].TemplateBiometricParameterId = ${tbpLookup(parameterCode, programCode)})`;
  return `INSERT INTO [dbo].[TemplateBiometricParameterWeekDayTimer] ([Id] ,[TemplateBiometricParameterWeekDayId] ,[WeekDayStartTime] ,[IsActive])
VALUES (
    NEWID() --id
    ,${tbpwLookup} ,${formatWeekDayStartTime(time)} ,1);`;
}

// -- ClinicalDataType INSERT (BP) ---------------------------------------------

function generateClinicalDataTypeInsert(
  param: NewParameter,
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
  parameters: TemplateParameter[],
  schedules: BiometricSchedule[]
): string {
  const lines: string[] = [
    `-- =============================================`,
    `-- Template: ${program.name} (${program.code})`,
    `-- =============================================`,
    ``,
    generateTemplateInsert(program),
  ];

  const scheduleByCode = new Map(schedules.map((s) => [s.code, s]));

  for (const param of parameters) {
    lines.push("");
    lines.push("");
    lines.push(`-- =============================================`);
    lines.push(`-- Biometric Parameters: ${param.name} (${param.code})`);
    lines.push(`-- =============================================`);
    lines.push("GO");
    lines.push(generateBiometricParameterInsert(param, program.code));

    if (!param.isRecurring) continue;
    const schedule = scheduleByCode.get(param.code);
    if (!schedule) continue;

    if (schedule.periodCode) {
      lines.push("");
      lines.push("--Periods");
      lines.push(generateBiometricPeriodInsert(param.code, schedule.periodCode, program.code));
    }

    if (schedule.weekDays.length > 0) {
      lines.push("");
      lines.push("--Week days and hours");
      for (const day of schedule.weekDays) {
        lines.push(`--Day ${day.dayNumber} - ${day.times.join(" , ")}`);
        lines.push(generateBiometricWeekDayInsert(param.code, day.dayNumber, program.code));
        for (const time of day.times) {
          lines.push(generateBiometricWeekDayTimerInsert(param.code, day.dayNumber, time, program.code));
        }
        lines.push("");
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function generateBpSql(
  newParameters: NewParameter[]
): string | null {
  if (newParameters.length === 0) return null;

  const lines: string[] = [
    `-- =============================================`,
    `-- New Biometric Parameters (ClinicalDataType)`,
    `-- =============================================`,
  ];

  newParameters.forEach((param, index) => {
    if (index > 0) lines.push("", "GO");
    lines.push("", generateClinicalDataTypeInsert(param, index + 1));
  });

  lines.push("", "GO", "");
  return lines.join("\n");
}

// -- PRePhysicalExercise INSERT (Pre-rehabilitation exercise catalog) ---------

function generatePreExerciseInsert(exercise: NewExercise): string {
  return `INSERT INTO [dbo].[PRePhysicalExercise] ([Id], [Code], [Description], [ShortDescription], [Image], [ImagePath], [IsActive], [CreateBy], [CreateDateTime], [ModifyBy], [ModifyDateTime], [Order], [Objective], [Instructions], [ImageURL], [IconURL], [CreateDateTimeOld], [ModifyDateTimeOld])
VALUES (
    NEWID() -- id
    ,${sqlString(exercise.code)} -- code
    ,${sqlString(exercise.description)} -- description
    ,${sqlString(exercise.shortDescription)} -- shortDescription
    ,NULL -- image
    ,NULL -- imagePath
    ,1 -- isActive
    ,'00000000-0000-0000-0000-000000000000' -- createBy
    ,SYSDATETIME() -- createDateTime
    ,'00000000-0000-0000-0000-000000000000' -- modifyBy
    ,SYSDATETIME() -- modifyDateTime
    ,${exercise.order} -- order
    ,${exercise.objective ? sqlString(exercise.objective) : "NULL"} -- objective
    ,${exercise.instructions ? sqlString(exercise.instructions) : "NULL"} -- instructions
    ,NULL -- imageURL
    ,NULL -- iconURL
    ,NULL -- createDateTimeOld
    ,NULL -- modifyDateTimeOld
);`;
}

export function generatePreSql(exercises: NewExercise[]): string | null {
  if (exercises.length === 0) return null;

  const lines: string[] = [
    `-- =============================================`,
    `-- New Physical Exercises (PRePhysicalExercise)`,
    `-- =============================================`,
  ];

  exercises.forEach((exercise, index) => {
    if (index > 0) lines.push("", "GO");
    lines.push("", generatePreExerciseInsert(exercise));
  });

  lines.push("", "GO", "");
  return lines.join("\n");
}

// -- EducationalContent.[Item] INSERT (Educational content catalog) -----------

function generateEducationalContentItemCatalogInsert(item: NewContent): string {
  const categoryLookup = item.categoryCode
    ? `(SELECT [Id] FROM [EducationalContent].[Category] WHERE [Code] = ${sqlString(item.categoryCode)})`
    : "NULL";

  return `INSERT INTO [EducationalContent].[Item] ([Id], [Title], [Code], [CategoryId], [Description], [ImageURL], [IsActive], [CreateDateTime], [ModifyDateTime], [Objective], [Order], [CreateDateTimeOld], [ModifyDateTimeOld])
VALUES (
    NEWID() -- Id
    ,${sqlString(item.title)} -- Title
    ,${sqlString(item.code)} -- Code
    ,${categoryLookup} -- CategoryId
    ,${item.description ? sqlString(item.description) : "NULL"} -- Description
    ,NULL -- ImageURL
    ,1 -- IsActive
    ,SYSDATETIME() -- CreateDateTime
    ,NULL -- ModifyDateTime
    ,${item.objective ? sqlString(item.objective) : "NULL"} -- Objective
    ,${item.order} -- Order
    ,SYSDATETIME() -- CreateDateTimeOld
    ,NULL -- ModifyDateTimeOld
);`;
}

export function generateContentSql(items: NewContent[]): string | null {
  if (items.length === 0) return null;

  const lines: string[] = [
    `-- =============================================`,
    `-- New Educational Content Items (EducationalContent.Item)`,
    `-- =============================================`,
  ];

  items.forEach((item, index) => {
    if (index > 0) lines.push("", "GO");
    lines.push("", generateEducationalContentItemCatalogInsert(item));
  });

  lines.push("", "GO", "");
  return lines.join("\n");
}

// -- TemplateEducationalContentPlan INSERT ------------------------------------

function generateEducationalContentPlanInsert(
  programCode: string,
  plan: ContentPlan
): string {
  return `INSERT INTO [dbo].[TemplateEducationalContentPlan] ([Id] ,[TemplateId] ,[Description], [DurationInDays] ,[ContentPerDay] ,[IsOrderMandatory] ,[IsActive], [ProgramCode])
VALUES (NEWID() --id
, (SELECT [Id] FROM [Template] WHERE [ProgramCode] = ${sqlString(programCode)}) --templateId
, ${sqlString(plan.description)} --description
 ,${plan.durationDays} --durationInDays
 ,${plan.contentsPerDay} --contentPerDay
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
  const planLookup = `(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = ${sqlString(programCode)} AND [Description] = ${sqlString(item.planDescription)})`;

  return `INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,${planLookup} --planId
    ,${sqlString(item.code)} --code
    ,'${item.order}' --itemNumber
    ,1 --isActive
    );`;
}

// -- 03-Conteudos.sql ---------------------------------------------------------

export function generateConteudosSql(
  programCode: string,
  plans: ContentPlan[],
  items: EducationalContentItem[]
): string {
  const lines: string[] = [
    `-- =============================================`,
    `-- Educational Content Plans (${programCode})`,
    `-- =============================================`,
  ];

  for (const plan of plans) {
    lines.push("", generateEducationalContentPlanInsert(programCode, plan));
  }

  for (const item of items) {
    lines.push("", generateEducationalContentItemInsert(item, programCode));
  }

  lines.push("");
  return lines.join("\n");
}
