import type { ProgramData, TemplateParameter, NewParameter, NewExercise, NewContent, BiometricSchedule, ContentPlan, ExercisePlan, EducationalContentItem, TemplateExerciseItem, AnswerKey, PredefinedQuestion, PredefinedQuestionnaire, QuestionnaireSchedule, AlertRule } from "./types.js";

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function formatDecimal(value: number): string {
  return `CAST(${value} AS Decimal(19, 6))`;
}

function splitPeriodCodes(periodCode: string): string[] {
  return periodCode.split(",").map(p => p.trim()).filter(p => p.length > 0);
}

export function wrapInTransaction(sql: string): string {
  return `BEGIN TRY
    BEGIN TRANSACTION;

${sql}

    COMMIT TRANSACTION;
    PRINT 'Script ejecutado con éxito.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT 'Error detectado. Se hizo ROLLBACK de toda la transacción.';
    THROW;
END CATCH
GO`;
}

// -- Program INSERT ------------------------------------------------------------

export function generateProgramSql(program: ProgramData): string {
  return `-- =============================================
-- Program: ${program.name} (${program.code})
-- =============================================

INSERT INTO [dbo].[Program] ([Id] ,[Code] ,[Description] ,[Order] ,[HealthTypeExternalId] ,[HealthSpecialtyExternalId] ,[IsActive] ,[ShortDescription] ,[CodeTM] ,[IsLocal] ,[DefaultProfessionalId] ,[DefaultOrganizationId])
VALUES (
    NEWID() --id
    ,${sqlString(program.code)} --code
    ,${sqlString(program.name)} --description
    ,${program.order} --order
    ,1 --healthTypeExternalId
    ,1 --healthSpecialtyExternalId
    ,1 --isActive
    ,${sqlString(program.shortDescription)} --shortDescription
    ,${sqlString(program.code)} --codeTM
    ,1 --isLocal
    ,NULL --defaultProfessionalId
    ,NULL --defaultOrganizationId
);`;
}

export function generateProgramDeleteSql(program: ProgramData): string {
  const pc = sqlString(program.code);
  return `-- =============================================
-- Rollback de 02-Program.sql para Code = ${pc}
-- =============================================

DELETE FROM [dbo].[Program] WHERE [Code] = ${pc};`;
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
    ,${param.isRecurring ? 1 : 0} --isRecurringMonitoring
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

// -- TemplatePhysicalRehabilitationPlan + schedule ----------------------------

function exercisePlanLookup(programCode: string, description: string): string {
  return `(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${sqlString(programCode)} AND [Description] = ${sqlString(description)})`;
}

function generateExercisePlanInsert(programCode: string, plan: ExercisePlan): string {
  return `INSERT INTO [dbo].[TemplatePhysicalRehabilitationPlan] ([Id] ,[TemplateId] ,[Description] ,[IsRecurringMonitoring] ,[DurationInDays] ,[NumberOccurrences] ,[StartTime] ,[EndTime] ,[ReceiveUnfulfilledAlerts] ,[IsActive] ,[ProgramCode])
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${sqlString(programCode)}) --templateId
    ,${sqlString(plan.description)} --description
    ,${plan.isRecurring ? 1 : 0} --isRecurringMonitoring
    ,${plan.durationDays} --durationInDays
    ,NULL --numberOccurrences
    ,NULL --startTime
    ,NULL --endTime
    ,0 --receiveUnfulfilledAlerts
    ,1 --isActive
    ,${sqlString(programCode)} --programCode
    );`;
}

function generateExercisePeriodInsert(programCode: string, plan: ExercisePlan, periodCode: string): string {
  return `INSERT INTO [dbo].[TemplatePhysicalRehabilitationPeriod] ([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[PeriodCode] ,[IsActive])
VALUES (
    NEWID() --id
    ,${exercisePlanLookup(programCode, plan.description)} --templatePhysicalRehabilitationPlanId
    ,${sqlString(periodCode)} --periodCode
    ,1 --isActive
    );`;
}

function generateExerciseWeekDayInsert(programCode: string, plan: ExercisePlan, dayNumber: number): string {
  return `INSERT INTO [dbo].[TemplatePhysicalRehabilitationWeekDay] ([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[DayNumber] ,[IsActive])
VALUES (
    NEWID() --id
    ,${exercisePlanLookup(programCode, plan.description)} --templatePhysicalRehabilitationPlanId
    ,${dayNumber} --dayNumber
    ,1 --isActive
    );`;
}

function generateExerciseWeekDayTimerInsert(programCode: string, plan: ExercisePlan, dayNumber: number, time: string): string {
  const weekDayLookup = `(SELECT [Id] FROM [TemplatePhysicalRehabilitationWeekDay] WHERE [DayNumber] = ${dayNumber} AND [TemplatePhysicalRehabilitationPlanId] = ${exercisePlanLookup(programCode, plan.description)})`;
  return `INSERT INTO [dbo].[TemplatePhysicalRehabilitationWeekDayTimer] ([Id] ,[TemplatePhysicalRehabilitationWeekDayId] ,[WeekDayStartTime] ,[WeekDayEndTime] ,[IsActive])
VALUES (
    NEWID() --id
    ,${weekDayLookup} --templatePhysicalRehabilitationWeekDayId
    ,${formatWeekDayStartTime(time)} --weekDayStartTime
    ,NULL --weekDayEndTime
    ,1 --isActive
    );`;
}

// -- TemplateEducationalContentPlan + schedule --------------------------------

function contentPlanLookup(programCode: string, description: string): string {
  return `(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = ${sqlString(programCode)} AND [Description] = ${sqlString(description)})`;
}

function generateContentPlanPeriodInsert(programCode: string, plan: ContentPlan, periodCode: string): string {
  return `INSERT INTO [dbo].[TemplateEducationalContentPeriod] ([Id] ,[TemplateEducationalContentPlanId] ,[IsActive] ,[PeriodCode])
VALUES (
    NEWID() --id
    ,${contentPlanLookup(programCode, plan.description)} --templateEducationalContentPlanId
    ,1 --isActive
    ,${sqlString(periodCode)} --periodCode
    );`;
}

function generateContentPlanWeekDayInsert(programCode: string, plan: ContentPlan, dayNumber: number): string {
  return `INSERT INTO [dbo].[TemplateEducationalContentWeekDay] ([Id] ,[TemplateEducationalContentPlanId] ,[DayNumber] ,[IsActive])
VALUES (
    NEWID() --id
    ,${contentPlanLookup(programCode, plan.description)} --templateEducationalContentPlanId
    ,${dayNumber} --dayNumber
    ,1 --isActive
    );`;
}

// -- TemplateQuestionnaire + schedule -----------------------------------------

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^questionario\s+/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function deriveQuestionnaireCode(description: string): string {
  return description
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[Qq]uestion[aá]rio\s+/, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

interface ResolvedQuestionnaire {
  code: string;
  description: string;
  schedule: QuestionnaireSchedule;
}

function resolveQuestionnaireSchedules(
  schedules: QuestionnaireSchedule[],
  predefined: PredefinedQuestionnaire[]
): ResolvedQuestionnaire[] {
  const byNorm = new Map<string, PredefinedQuestionnaire>();
  for (const q of predefined) byNorm.set(normalizeForMatch(q.description), q);

  return schedules.map((schedule) => {
    const match = byNorm.get(normalizeForMatch(schedule.description));
    const description = match ? match.description : schedule.description;
    const code = schedule.code || (match ? match.code : deriveQuestionnaireCode(schedule.description));
    return { code, description, schedule };
  });
}

function templateQuestionnaireLookup(programCode: string, code: string): string {
  return `(SELECT [Id] FROM [TemplateQuestionnaire] WHERE [Code] = ${sqlString(code)} AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${sqlString(programCode)}))`;
}

function generateTemplateQuestionnaireInsert(programCode: string, q: ResolvedQuestionnaire): string {
  return `INSERT INTO [dbo].[TemplateQuestionnaire] ([Id] ,[Code] ,[Description] ,[TemplateQuestionnaireCategoryId] ,[StartTime] ,[IsRecurringMonitoring] ,[IsActive] ,[ProgramCode] ,[TemplateId] ,[ProfessionalQuestionnaireId] ,[DurationInDays] ,[NumberOccurences] ,[EndTime] ,[ReceiveUnfulfilledAlerts] ,[Migrated])
VALUES (
    NEWID() --id
    ,${sqlString(q.code)} --code
    ,${sqlString(q.description)} --description
    ,NULL --templateQuestionnaireCategoryId
    ,NULL --startTime
    ,${q.schedule.isRecurring ? 1 : 0} --isRecurringMonitoring
    ,1 --isActive
    ,${sqlString(programCode)} --programCode
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${sqlString(programCode)}) --templateId
    ,NULL --professionalQuestionnaireId
    ,${q.schedule.durationDays} --durationInDays
    ,NULL --numberOccurences
    ,NULL --endTime
    ,0 --receiveUnfulfilledAlerts
    ,0 --migrated
);`;
}

function generateTemplateQuestionnairePeriodInsert(programCode: string, q: ResolvedQuestionnaire, periodCode: string): string {
  return `INSERT INTO [dbo].[TemplateQuestionnairePeriod] ([Id] ,[Code] ,[TemplateQuestionnaireId] ,[IsActive])
VALUES (
    NEWID() --id
    ,${sqlString(periodCode)} --code
    ,${templateQuestionnaireLookup(programCode, q.code)} --templateQuestionnaireId
    ,1 --isActive
);`;
}

function generateTemplateQuestionnaireWeekDayInsert(programCode: string, q: ResolvedQuestionnaire, dayNumber: number): string {
  return `INSERT INTO [dbo].[TemplateQuestionnaireWeekDay] ([Id] ,[TemplateQuestionnaireId] ,[DayNumber] ,[IsActive])
VALUES (
    NEWID() --id
    ,${templateQuestionnaireLookup(programCode, q.code)} --templateQuestionnaireId
    ,${dayNumber} --dayNumber
    ,1 --isActive
);`;
}

function generateTemplateQuestionnaireWeekDayTimerInsert(programCode: string, q: ResolvedQuestionnaire, dayNumber: number, time: string): string {
  const weekDayLookup = `(SELECT [Id] FROM [TemplateQuestionnaireWeekDay] WHERE [DayNumber] = ${dayNumber} AND [TemplateQuestionnaireId] = ${templateQuestionnaireLookup(programCode, q.code)})`;
  return `INSERT INTO [dbo].[TemplateQuestionnaireWeekDayTimer] ([Id] ,[TemplateQuestionnaireWeekDayId] ,[WeekDayStartTime] ,[WeekDayEndTime] ,[IsActive])
VALUES (
    NEWID() --id
    ,${weekDayLookup} --templateQuestionnaireWeekDayId
    ,${formatWeekDayStartTime(time)} --weekDayStartTime
    ,NULL --weekDayEndTime
    ,1 --isActive
);`;
}

// -- Public API ---------------------------------------------------------------

export function generateTemplateSql(
  program: ProgramData,
  parameters: TemplateParameter[],
  schedules: BiometricSchedule[],
  questionnaireSchedules: QuestionnaireSchedule[],
  predefinedQuestionnaires: PredefinedQuestionnaire[],
  exercisePlans: ExercisePlan[],
  contentPlans: ContentPlan[]
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
    lines.push(generateBiometricParameterInsert(param, program.code));

    if (!param.isRecurring) continue;
    const schedule = scheduleByCode.get(param.code);
    if (!schedule) continue;

    if (schedule.periodCode) {
      lines.push("");
      lines.push("--Periods");
      const periods = splitPeriodCodes(schedule.periodCode);
      for (const period of periods) {
        lines.push(generateBiometricPeriodInsert(param.code, period, program.code));
      }
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

  const resolvedQuestionnaires = resolveQuestionnaireSchedules(questionnaireSchedules, predefinedQuestionnaires);
  for (const q of resolvedQuestionnaires) {
    lines.push("");
    lines.push("");
    lines.push(`-- =============================================`);
    lines.push(`-- Questionarios: ${q.description}`);
    lines.push(`-- =============================================`);
    lines.push(generateTemplateQuestionnaireInsert(program.code, q));

    if (!q.schedule.isRecurring) continue;

    if (q.schedule.periodCode) {
      lines.push("");
      lines.push("--Periods");
      const periods = splitPeriodCodes(q.schedule.periodCode);
      for (const period of periods) {
        lines.push(generateTemplateQuestionnairePeriodInsert(program.code, q, period));
      }
    }

    if (q.schedule.weekDays.length > 0) {
      lines.push("");
      lines.push("--Week days and hours");
      for (const day of q.schedule.weekDays) {
        lines.push(`--Day ${day.dayNumber} - ${day.times.join(" , ")}`);
        lines.push(generateTemplateQuestionnaireWeekDayInsert(program.code, q, day.dayNumber));
        for (const time of day.times) {
          lines.push(generateTemplateQuestionnaireWeekDayTimerInsert(program.code, q, day.dayNumber, time));
        }
        lines.push("");
      }
    }
  }

  for (const plan of exercisePlans) {
    lines.push("");
    lines.push("");
    lines.push(`-- =============================================`);
    lines.push(`-- Exercicios: ${plan.description}`);
    lines.push(`-- =============================================`);
    lines.push(generateExercisePlanInsert(program.code, plan));

    if (!plan.isRecurring) continue;

    if (plan.periodCode) {
      lines.push("");
      lines.push("--Periods");
      const periods = splitPeriodCodes(plan.periodCode);
      for (const period of periods) {
        lines.push(generateExercisePeriodInsert(program.code, plan, period));
      }
    }

    if (plan.weekDays.length > 0) {
      lines.push("");
      lines.push("--Week days and hours");
      for (const day of plan.weekDays) {
        lines.push(`--Day ${day.dayNumber} - ${day.times.join(" , ")}`);
        lines.push(generateExerciseWeekDayInsert(program.code, plan, day.dayNumber));
        for (const time of day.times) {
          lines.push(generateExerciseWeekDayTimerInsert(program.code, plan, day.dayNumber, time));
        }
        lines.push("");
      }
    }
  }

  for (const plan of contentPlans) {
    lines.push("");
    lines.push("");
    lines.push(`-- =============================================`);
    lines.push(`-- Educational Content Plans: ${plan.description}`);
    lines.push(`-- =============================================`);
    lines.push(generateEducationalContentPlanInsert(program.code, plan));

    if (!plan.isRecurring) continue;

    if (plan.periodCode) {
      lines.push("");
      lines.push("--Periods");
      const periods = splitPeriodCodes(plan.periodCode);
      for (const period of periods) {
        lines.push(generateContentPlanPeriodInsert(program.code, plan, period));
      }
    }

    if (plan.activeDays.length > 0) {
      lines.push("");
      lines.push("--Week days");
      for (const dayNumber of plan.activeDays) {
        lines.push(`--Day ${dayNumber}`);
        lines.push(generateContentPlanWeekDayInsert(program.code, plan, dayNumber));
      }
      lines.push("");
    }
  }

  lines.push("");
  return lines.join("\n");
}

function generateBpCatalogParameterInsert(code: string): string {
  const codeStr = sqlString(code);
  const cdt = `(SELECT TOP (1) [Id] FROM [dbo].[ClinicalDataType] WHERE [Code] = ${codeStr})`;
  return `IF NOT EXISTS (SELECT 1 FROM [dbo].[BiometricParameter] WHERE [ClinicalDataTypeId] = ${cdt})
BEGIN
    INSERT INTO [dbo].[BiometricParameter] ([Id] ,[ClinicalDataTypeId] ,[IsActive])
    VALUES (${cdt} ,${cdt} ,1)
END`;
}

function generateBpCatalogAlertInsert(code: string): string {
  const codeStr = sqlString(code);
  const cdt = `(SELECT TOP (1) [Id] FROM [dbo].[ClinicalDataType] WHERE [Code] = ${codeStr})`;
  return `INSERT INTO [dbo].[BiometricParameterAlertClinicalDataType]
    SELECT NEWID() ,[BP].[Id] ,[BP].[ClinicalDataTypeId] ,1
    FROM [dbo].[BiometricParameter] [BP]
    WHERE [BP].[ClinicalDataTypeId] = ${cdt};`;
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
    lines.push(``, `-- Parameter: ${param.name} (${param.code})`);
    lines.push(generateClinicalDataTypeInsert(param, index + 1));
    lines.push(generateBpCatalogParameterInsert(param.code));
    lines.push(generateBpCatalogAlertInsert(param.code));
  });

  lines.push("");
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
    ,NULL -- modifyBy
    ,NULL -- modifyDateTime
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
    lines.push("", generatePreExerciseInsert(exercise));
  });

  lines.push("");
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
    lines.push("", generateEducationalContentItemCatalogInsert(item));
  });

  lines.push("");
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
  items: EducationalContentItem[]
): string {
  const lines: string[] = [
    `-- =============================================`,
    `-- Educational Content Items (${programCode})`,
    `-- =============================================`,
  ];

  let lastPlan = "";
  for (const item of items) {
    if (item.planDescription !== lastPlan) {
      lines.push("");
      lines.push(`-- Plan: ${item.planDescription}`);
      lastPlan = item.planDescription;
    }
    lines.push("", generateEducationalContentItemInsert(item, programCode));
  }

  lines.push("");
  return lines.join("\n");
}

// -- TemplatePhysicalRehabilitationItem INSERT --------------------------------

function generateTemplateExerciseItemInsert(item: TemplateExerciseItem, programCode: string): string {
  const planLookup = `(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${sqlString(programCode)} AND [Description] = ${sqlString(item.planDescription)})`;
  const instructions = item.instructions ? sqlString(item.instructions) : "NULL";

  return `INSERT INTO [dbo].[TemplatePhysicalRehabilitationItem] ([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[PhysicalExerciseCode] ,[Order] ,[Instructions] ,[IsActive])
VALUES (
    NEWID() --id
    ,${planLookup} --templatePhysicalRehabilitationPlanId
    ,${sqlString(item.code)} --physicalExerciseCode
    ,${item.order} --order
    ,${instructions} --instructions
    ,1 --isActive
);`;
}

// -- TemplatePhysicalRehabilitationItemParameter INSERT -----------------------

function templateExerciseItemLookup(item: TemplateExerciseItem, programCode: string): string {
  const planLookup = `(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${sqlString(programCode)} AND [Description] = ${sqlString(item.planDescription)})`;
  return `(SELECT [Id] FROM [TemplatePhysicalRehabilitationItem] WHERE [PhysicalExerciseCode] = ${sqlString(item.code)} AND [TemplatePhysicalRehabilitationPlanId] = ${planLookup})`;
}

function generateTemplateExerciseItemParameterInsert(item: TemplateExerciseItem, programCode: string, parameterCode: string, value: number): string {
  return `INSERT INTO [dbo].[TemplatePhysicalRehabilitationItemParameter] ([Id] ,[TemplatePhysicalRehabilitationItemId] ,[ParameterCode] ,[Value] ,[Order] ,[IsActive])
VALUES (
    NEWID() --id
    ,${templateExerciseItemLookup(item, programCode)} --templatePhysicalRehabilitationItemId
    ,${sqlString(parameterCode)} --parameterCode
    ,${value} --value
    ,${item.order} --order
    ,1 --isActive
);`;
}

// -- 04.1-Exercicios-Parametros.sql -------------------------------------------

export function generateExerciciosParametrosSql(
  programCode: string,
  items: TemplateExerciseItem[]
): string | null {
  const itemsWithParams = items.filter((it) => it.parameters.length > 0);
  if (itemsWithParams.length === 0) return null;

  const lines: string[] = [
    `-- =============================================`,
    `-- Template Physical Rehabilitation Item Parameters (${programCode})`,
    `-- =============================================`,
  ];

  let lastPlan = "";
  for (const item of itemsWithParams) {
    if (item.planDescription !== lastPlan) {
      lines.push("");
      lines.push(`-- =============================================`);
      lines.push(`-- Exercicios: ${item.planDescription}`);
      lines.push(`-- =============================================`);
      lastPlan = item.planDescription;
    }
    lines.push("");
    lines.push(`-- Item: ${item.code}`);
    for (const p of item.parameters) {
      lines.push(generateTemplateExerciseItemParameterInsert(item, programCode, p.code, p.value));
    }
  }

  lines.push("");
  return lines.join("\n");
}

// -- 04-Exercicios.sql --------------------------------------------------------

export function generateExerciciosSql(
  programCode: string,
  items: TemplateExerciseItem[]
): string {
  const lines: string[] = [
    `-- =============================================`,
    `-- Template Physical Rehabilitation Items (${programCode})`,
    `-- =============================================`,
  ];

  let lastPlan = "";
  for (const item of items) {
    if (item.planDescription !== lastPlan) {
      lines.push("");
      lines.push(`-- Plan: ${item.planDescription}`);
      lastPlan = item.planDescription;
    }
    lines.push("", generateTemplateExerciseItemInsert(item, programCode));
  }

  lines.push("");
  return lines.join("\n");
}

// -- Answer / Question / QuestionAnswer / ProfessionalQuestionnaire ----------

const SYSTEM_USER = "'00000000-0000-0000-0000-000000000000'";

function generateAnswerInsert(key: AnswerKey): string {
  return `INSERT INTO [dbo].[Answer] ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score])
VALUES (
    NEWID() --id
    ,${sqlString(key.code)} --code
    ,${sqlString(key.description)} --description
    ,${sqlString(key.description)} --shortDescription
    ,${key.value} --value
    ,NULL --order
    ,1 --isActive
    ,${SYSTEM_USER} --createBy
    ,SYSDATETIME() --createDateTime
    ,NULL --modifyBy
    ,NULL --modifyDateTime
    ,NULL --endValue
    ,NULL --score
);`;
}

function generateQuestionInsert(question: PredefinedQuestion): string {
  const dataType = question.responseKeyType === "LIKERT" ? "STRING" : "NUMERIC";
  const minValue = question.minValue != null ? String(question.minValue) : "NULL";
  const maxValue = question.maxValue != null ? String(question.maxValue) : "NULL";
  const order = question.order != null ? String(question.order) : "NULL";
  const instructions = question.instructions ? sqlString(question.instructions) : "NULL";
  const responseKeyType = question.responseKeyType ? sqlString(question.responseKeyType) : "NULL";

  return `INSERT INTO [dbo].[Question] ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[DataType] ,[Instructions] ,[ResponseKeyType] ,[MinValue] ,[MaxValue] ,[ParentQuestionId] ,[UseInCustomQuestionnaire] ,[Title])
VALUES (
    NEWID() --id
    ,${sqlString(question.code)} --code
    ,${sqlString(question.description)} --description
    ,${sqlString(question.description)} --shortDescription
    ,${order} --order
    ,1 --isActive
    ,${SYSTEM_USER} --createBy
    ,SYSDATETIME() --createDateTime
    ,NULL --modifyBy
    ,NULL --modifyDateTime
    ,'${dataType}' --dataType
    ,${instructions} --instructions
    ,${responseKeyType} --responseKeyType
    ,${minValue} --minValue
    ,${maxValue} --maxValue
    ,NULL --parentQuestionId
    ,${question.useInCustomQuestionnaire} --useInCustomQuestionnaire
    ,${sqlString(question.title)} --title
);`;
}

function generateQuestionAnswerInsert(questionCode: string, key: AnswerKey): string {
  return `INSERT INTO [dbo].[QuestionAnswer] ([Id] ,[QuestionId] ,[AnswerId] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime])
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [Question] WHERE [Code] = ${sqlString(questionCode)}) --questionId
    ,(SELECT [Id] FROM [Answer] WHERE [Code] = ${sqlString(key.code)}) --answerId
    ,${key.value} --order
    ,1 --isActive
    ,${SYSTEM_USER} --createBy
    ,SYSDATETIME() --createDateTime
    ,NULL --modifyBy
    ,NULL --modifyDateTime
);`;
}

function generateProfessionalQuestionnaireInsert(questionnaire: PredefinedQuestionnaire): string {
  const instructions = questionnaire.instructions ? sqlString(questionnaire.instructions) : "NULL";
  return `INSERT INTO [dbo].[ProfessionalQuestionnaire] ([Id] ,[Description] ,[QuestionnaireCategoryId] ,[OrganizationId] ,[ProfessionalId] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[DeactivationDateTime] ,[DisabledBy] ,[Code] ,[IsVisible] ,[Context] ,[Instructions] ,[IconURL])
VALUES (
    NEWID() --id
    ,${sqlString(questionnaire.description)} --description
    ,(SELECT [Id] FROM [QuestionnaireCategory] WHERE [Code] = 'PREDEFINED') --questionnaireCategoryId
    ,NULL --organizationId
    ,NULL --professionalId
    ,1 --isActive
    ,${SYSTEM_USER} --createBy
    ,SYSDATETIME() --createDateTime
    ,NULL --modifyBy
    ,NULL --modifyDateTime
    ,NULL --deactivationDateTime
    ,NULL --disabledBy
    ,${sqlString(questionnaire.code)} --code
    ,1 --isVisible
    ,NULL --context
    ,${instructions} --instructions
    ,NULL --iconURL
);`;
}

function generateProfessionalQuestionnaireQuestionInsert(question: PredefinedQuestion, questionnaireCode: string): string {
  const order = question.order != null ? String(question.order) : "NULL";
  return `INSERT INTO [dbo].[ProfessionalQuestionnaireQuestion] ([Id] ,[QuestionId] ,[ProfessionalQuestionnaireId] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[Order] ,[QuestionNumber])
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [Question] WHERE [Code] = ${sqlString(question.code)}) --questionId
    ,(SELECT [Id] FROM [ProfessionalQuestionnaire] WHERE [Code] = ${sqlString(questionnaireCode)}) --professionalQuestionnaireId
    ,1 --isActive
    ,${SYSTEM_USER} --createBy
    ,SYSDATETIME() --createDateTime
    ,${order} --order
    ,${sqlString(question.questionNumber)} --questionNumber
);`;
}

// -- 01-Quest.sql -------------------------------------------------------------

export function generateQuestSql(questionnaires: PredefinedQuestionnaire[]): string | null {
  if (questionnaires.length === 0) return null;

  const lines: string[] = [];
  const emittedAnswerCodes = new Set<string>();

  for (const q of questionnaires) {
    lines.push("-- =============================================");
    lines.push(`-- Novo questionário: ${q.description}`);
    lines.push("-- =============================================");

    for (const question of q.questions) {
      lines.push("");
      lines.push(`-- ###### Questão ${question.code}: ${question.description} ######`);

      if (question.newAnswerKeys && question.answerKeys.length > 0) {
        lines.push("");
        lines.push("-- Chaves de resposta");
        for (const key of question.answerKeys) {
          if (emittedAnswerCodes.has(key.code)) continue;
          emittedAnswerCodes.add(key.code);
          lines.push(generateAnswerInsert(key));
        }
      }

      lines.push("");
      lines.push("-- Question");
      lines.push(generateQuestionInsert(question));

      if (question.answerKeys.length > 0) {
        lines.push("");
        lines.push("-- Question Answers");
        for (const key of question.answerKeys) {
          lines.push(generateQuestionAnswerInsert(question.code, key));
        }
      }
    }

    lines.push("");
    lines.push("-- Professional Questionnaire");
    lines.push(generateProfessionalQuestionnaireInsert(q));

    lines.push("");
    lines.push("-- Professional Questionnaire Questions");
    for (const question of q.questions) {
      lines.push(generateProfessionalQuestionnaireQuestionInsert(question, q.code));
    }

    lines.push("");
    lines.push("");
  }

  return lines.join("\n");
}

// =============================================================================
// DELETE script generators (rollback de cada archivo INSERT)
// =============================================================================

function inList(values: string[]): string {
  return values.map(sqlString).join(", ");
}

export function generateTemplateDeleteSql(programCode: string): string {
  const pc = sqlString(programCode);
  return `-- =============================================
-- Rollback de 02-Template.sql para ProgramCode = ${pc}
-- =============================================

-- 1. Educational Content (plan-level)
DELETE FROM [dbo].[TemplateEducationalContentWeekDay] WHERE [TemplateEducationalContentPlanId] IN (SELECT [Id] FROM [dbo].[TemplateEducationalContentPlan] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplateEducationalContentPeriod] WHERE [TemplateEducationalContentPlanId] IN (SELECT [Id] FROM [dbo].[TemplateEducationalContentPlan] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplateEducationalContentPlan] WHERE [ProgramCode] = ${pc};

-- 2. Physical Rehabilitation (plan-level)
DELETE FROM [dbo].[TemplatePhysicalRehabilitationWeekDayTimer] WHERE [TemplatePhysicalRehabilitationWeekDayId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationWeekDay] WHERE [TemplatePhysicalRehabilitationPlanId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${pc}));
DELETE FROM [dbo].[TemplatePhysicalRehabilitationWeekDay] WHERE [TemplatePhysicalRehabilitationPlanId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplatePhysicalRehabilitationPeriod] WHERE [TemplatePhysicalRehabilitationPlanId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${pc};

-- 3. Questionnaires
DELETE FROM [dbo].[TemplateQuestionnaireWeekDayTimer] WHERE [TemplateQuestionnaireWeekDayId] IN (SELECT [Id] FROM [dbo].[TemplateQuestionnaireWeekDay] WHERE [TemplateQuestionnaireId] IN (SELECT [Id] FROM [dbo].[TemplateQuestionnaire] WHERE [ProgramCode] = ${pc}));
DELETE FROM [dbo].[TemplateQuestionnaireWeekDay] WHERE [TemplateQuestionnaireId] IN (SELECT [Id] FROM [dbo].[TemplateQuestionnaire] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplateQuestionnairePeriod] WHERE [TemplateQuestionnaireId] IN (SELECT [Id] FROM [dbo].[TemplateQuestionnaire] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplateQuestionnaire] WHERE [ProgramCode] = ${pc};

-- 4. Biometric Parameters
DELETE FROM [dbo].[TemplateBiometricParameterWeekDayTimer] WHERE [TemplateBiometricParameterWeekDayId] IN (SELECT [Id] FROM [dbo].[TemplateBiometricParameterWeekDay] WHERE [TemplateBiometricParameterId] IN (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [ProgramCode] = ${pc}));
DELETE FROM [dbo].[TemplateBiometricParameterWeekDay] WHERE [TemplateBiometricParameterId] IN (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplateBiometricParameterPeriod] WHERE [TemplateBiometricParameterId] IN (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [ProgramCode] = ${pc});
DELETE FROM [dbo].[TemplateBiometricParameter] WHERE [ProgramCode] = ${pc};

-- 5. Template raíz
DELETE FROM [dbo].[Template] WHERE [ProgramCode] = ${pc};`;
}

export function generateConteudosDeleteSql(programCode: string): string {
  const pc = sqlString(programCode);
  return `-- =============================================
-- Rollback de 03-Conteudos.sql para ProgramCode = ${pc}
-- =============================================

DELETE FROM [dbo].[TemplateEducationalContentItem] WHERE [TemplateEducationalContentPlanId] IN (SELECT [Id] FROM [dbo].[TemplateEducationalContentPlan] WHERE [ProgramCode] = ${pc});`;
}

export function generateExerciciosDeleteSql(programCode: string): string {
  const pc = sqlString(programCode);
  return `-- =============================================
-- Rollback de 04-Exercicios.sql para ProgramCode = ${pc}
-- =============================================

DELETE FROM [dbo].[TemplatePhysicalRehabilitationItem] WHERE [TemplatePhysicalRehabilitationPlanId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${pc});`;
}

export function generateExerciciosParametrosDeleteSql(programCode: string): string {
  const pc = sqlString(programCode);
  return `-- =============================================
-- Rollback de 04.1-Exercicios-Parametros.sql para ProgramCode = ${pc}
-- =============================================

DELETE FROM [dbo].[TemplatePhysicalRehabilitationItemParameter] WHERE [TemplatePhysicalRehabilitationItemId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationItem] WHERE [TemplatePhysicalRehabilitationPlanId] IN (SELECT [Id] FROM [dbo].[TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = ${pc}));`;
}

export function generateBpDeleteSql(newParameters: NewParameter[]): string | null {
  if (newParameters.length === 0) return null;
  const codes = inList(newParameters.map(p => p.code));
  return `-- =============================================
-- Rollback de 01-BP.sql (ClinicalDataType catalog)
-- =============================================

DELETE FROM [dbo].[ClinicalDataType] WHERE [Code] IN (${codes});`;
}

export function generatePreDeleteSql(exercises: NewExercise[]): string | null {
  if (exercises.length === 0) return null;
  const codes = inList(exercises.map(e => e.code));
  return `-- =============================================
-- Rollback de 01-PRE.sql (PRePhysicalExercise catalog)
-- =============================================

DELETE FROM [dbo].[PRePhysicalExercise] WHERE [Code] IN (${codes});`;
}

export function generateContentDeleteSql(items: NewContent[]): string | null {
  if (items.length === 0) return null;
  const codes = inList(items.map(i => i.code));
  return `-- =============================================
-- Rollback de 01-Content.sql (EducationalContent.Item catalog)
-- =============================================

DELETE FROM [EducationalContent].[Item] WHERE [Code] IN (${codes});`;
}

export function generateQuestDeleteSql(questionnaires: PredefinedQuestionnaire[]): string | null {
  if (questionnaires.length === 0) return null;

  const questionnaireCodes = inList(questionnaires.map(q => q.code));
  const questionCodes = new Set<string>();
  const newAnswerCodes = new Set<string>();
  for (const q of questionnaires) {
    for (const question of q.questions) {
      questionCodes.add(question.code);
      if (question.newAnswerKeys) {
        for (const key of question.answerKeys) newAnswerCodes.add(key.code);
      }
    }
  }

  const profQuestIds = `(SELECT [Id] FROM [dbo].[ProfessionalQuestionnaire] WHERE [Code] IN (${questionnaireCodes}))`;
  const patQuestIds = `(SELECT [Id] FROM [dbo].[PatientQuestionnaire] WHERE [ProfessionalQuestionnaireId] IN ${profQuestIds})`;
  const configDetailIds = `(SELECT [Id] FROM [dbo].[PatientQuestionnaireMonitorConfigurationDetail] WHERE [PatientQuestionnaireId] IN ${patQuestIds})`;

  const lines: string[] = [
    `-- =============================================`,
    `-- Rollback de 01-Quest.sql (ProfessionalQuestionnaire catalog)`,
    `-- =============================================`,
    ``,
    `-- Patient data (delete leaf→root to satisfy all FKs)`,
    `DELETE FROM [dbo].[PatientQuestionnaireQuestion] WHERE [PatientQuestionnaireId] IN ${patQuestIds};`,
    `DELETE FROM [dbo].[PatientQuestionnaireMonitorConfigurationProgram] WHERE [PatientQuestionnaireMonitorConfigurationDetailId] IN ${configDetailIds};`,
    `DELETE FROM [dbo].[PatientQuestionnaireMonitorConfigurationPeriod] WHERE [PatientQuestionnaireMonitorConfigurationDetailId] IN ${configDetailIds};`,
    `DELETE FROM [dbo].[PatientQuestionnaireMonitorSchedule] WHERE [PatientQuestionnaireMonitorConfigurationId] IN ${configDetailIds};`,
    `DELETE FROM [dbo].[PatientQuestionnaireMonitorConfigurationWeekDay] WHERE [PatientQuestionnaireMonitorConfigurationDetailId] IN ${configDetailIds};`,
    `DELETE FROM [dbo].[PatientQuestionnaireMonitorConfigurationDetail] WHERE [PatientQuestionnaireId] IN ${patQuestIds};`,
    `DELETE FROM [dbo].[PatientQuestionnaire] WHERE [ProfessionalQuestionnaireId] IN ${profQuestIds};`,
    ``,
    `DELETE FROM [dbo].[ProfessionalQuestionnaireQuestion] WHERE [ProfessionalQuestionnaireId] IN ${profQuestIds};`,
    `DELETE FROM [dbo].[ProfessionalQuestionnaire] WHERE [Code] IN (${questionnaireCodes});`,
  ];

  if (questionCodes.size > 0) {
    const qList = inList([...questionCodes]);
    lines.push(`DELETE FROM [dbo].[QuestionAnswer] WHERE [QuestionId] IN (SELECT [Id] FROM [dbo].[Question] WHERE [Code] IN (${qList}));`);
    lines.push(`DELETE FROM [dbo].[Question] WHERE [Code] IN (${qList});`);
  }

  if (newAnswerCodes.size > 0) {
    lines.push(`DELETE FROM [dbo].[Answer] WHERE [Code] IN (${inList([...newAnswerCodes])});`);
  }

  return lines.join("\n");
}

// =============================================================================
// 06-Regras-de-alerta.sql
// =============================================================================

function alertBiometricLookup(code: string, programCode: string): string {
  return `(SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = ${sqlString(code)} AND [ProgramCode] = ${sqlString(programCode)})`;
}

function alertQuestionnaireLookup(code: string, programCode: string): string {
  return `(SELECT [Id] FROM [dbo].[TemplateQuestionnaire] WHERE [Code] = ${sqlString(code)} AND [ProgramCode] = ${sqlString(programCode)})`;
}

function generateAlertItem(rule: AlertRule, alertLookup: string): string {
  const value = isNaN(Number(rule.value)) ? sqlString(rule.value) : rule.value;
  if (rule.prescriptionType === "biometric") {
    return `INSERT INTO [dbo].[TemplateItemBiometricParameterAlert] ([Id] ,[TemplateBiometricParameterAlertId] ,[CodeSnomed] ,[CodeAlertCondition] ,[Value] ,[IsActive] ,[Code])
VALUES (
    NEWID() --id
    ,${alertLookup} --templateBiometricParameterAlertId
    ,NULL --codeSnomed
    ,${sqlString(rule.operator)} --codeAlertCondition
    ,${value} --value
    ,1 --isActive
    ,NULL --code
);`;
  } else {
    return `INSERT INTO [dbo].[TemplateItemQuestionnaireAlert] ([Id] ,[TemplateQuestionnaireId] ,[CodeQuestion] ,[CodeAlertCondition] ,[CodeAnswer] ,[IsActive])
VALUES (
    NEWID() --id
    ,${alertLookup} --templateQuestionnaireId
    ,${sqlString(rule.code)} --codeQuestion
    ,${sqlString(rule.operator)} --codeAlertCondition
    ,${value} --codeAnswer
    ,1 --isActive
);`;
  }
}

function generateAlertGroup(groupId: string, groupRules: AlertRule[], programCode: string): string {
  const first = groupRules[0];
  const templateLookup = `(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${sqlString(programCode)})`;
  const severityCode = sqlString(first.severityCode);
  const lines: string[] = [`-- Group ${groupId}: ${groupRules.map(r => `${r.code} - ${r.operator} - ${r.value}`).join(" & ")}`];

  let alertLookup: string;

  if (first.prescriptionType === "biometric") {
    const paramLookup = alertBiometricLookup(first.code, programCode);
    alertLookup = `(SELECT [Id] FROM [dbo].[TemplateBiometricParameterAlert] WHERE [CodeSeverity] = ${severityCode} AND [TemplateBiometricParameterId] = ${paramLookup})`;
    lines.push(`INSERT INTO [dbo].[TemplateBiometricParameterAlert] ([Id] ,[TemplateBiometricParameterId] ,[CodeSeverity] ,[GroupId] ,[Snomed] ,[IsActive] ,[TemplateId])
VALUES (
    NEWID() --id
    ,${paramLookup} --templateBiometricParameterId
    ,${severityCode} --codeSeverity
    ,NULL --groupId
    ,NULL --snomed
    ,1 --isActive
    ,${templateLookup} --templateId
);`);
  } else {
    const questLookup = alertQuestionnaireLookup(first.code, programCode);
    alertLookup = `(SELECT [Id] FROM [dbo].[TemplateQuestionnaireAlert] WHERE [CodeSeverity] = ${severityCode} AND [TemplateQuestionnaireId] = ${questLookup})`;
    lines.push(`INSERT INTO [dbo].[TemplateQuestionnaireAlert] ([Id] ,[TemplateQuestionnaireId] ,[CodeSeverity] ,[GroupId] ,[IsActive] ,[TemplateId])
VALUES (
    NEWID() --id
    ,${questLookup} --templateQuestionnaireId
    ,${severityCode} --codeSeverity
    ,NULL --groupId
    ,1 --isActive
    ,${templateLookup} --templateId
);`);
  }

  for (const rule of groupRules) {
    lines.push(generateAlertItem(rule, alertLookup));
  }

  return lines.join("\n");
}

export function generateAlertRulesSql(programCode: string, rules: AlertRule[]): string | null {
  if (rules.length === 0) return null;

  // Preserve insertion order while grouping by groupId
  const groupOrder: string[] = [];
  const groupMap = new Map<string, AlertRule[]>();
  for (const rule of rules) {
    if (!groupMap.has(rule.groupId)) {
      groupOrder.push(rule.groupId);
      groupMap.set(rule.groupId, []);
    }
    groupMap.get(rule.groupId)!.push(rule);
  }

  const lines: string[] = [
    `-- =============================================`,
    `-- Alert Rules (${programCode})`,
    `-- =============================================`,
  ];

  for (const groupId of groupOrder) {
    lines.push("", generateAlertGroup(groupId, groupMap.get(groupId)!, programCode));
  }

  lines.push("");
  return lines.join("\n");
}

export function generateAlertRulesDeleteSql(programCode: string): string {
  const pc = sqlString(programCode);
  const tId = `(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = ${pc})`;
  return `-- =============================================
-- Rollback de 06-Regras-de-alerta.sql para ProgramCode = ${pc}
-- =============================================

-- Biometric alert items
DELETE FROM [dbo].[TemplateItemBiometricParameterAlert] WHERE [TemplateBiometricParameterAlertId] IN (SELECT [Id] FROM [dbo].[TemplateBiometricParameterAlert] WHERE [TemplateId] = ${tId});
DELETE FROM [dbo].[TemplateBiometricParameterAlert] WHERE [TemplateId] = ${tId};

-- Questionnaire alert items
DELETE FROM [dbo].[TemplateItemQuestionnaireAlert] WHERE [TemplateQuestionnaireAlertId] IN (SELECT [Id] FROM [dbo].[TemplateQuestionnaireAlert] WHERE [TemplateId] = ${tId});
DELETE FROM [dbo].[TemplateQuestionnaireAlert] WHERE [TemplateId] = ${tId};`;
}
