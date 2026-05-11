SELECT TOP (1000) [Id]
      ,[Code]
      ,[Description]
      ,[Order]
      ,[HealthTypeExternalId]
      ,[HealthSpecialtyExternalId]
      ,[IsActive]
      ,[ShortDescription]
      ,[CodeTM]
      ,[IsLocal]
      ,[DefaultProfessionalId]
      ,[DefaultOrganizationId]
  FROM [dbo].[Program]

  INSERT INTO [dbo].[Program]
([Id], [Code], [Description], [Order], [HealthTypeExternalId], [HealthSpecialtyExternalId], [IsActive], [ShortDescription], [CodeTM], [IsLocal], [DefaultProfessionalId], [DefaultOrganizationId])
VALUES (
    NEWID(),    -- Id (será gerado automaticamente)
    'DMT3',                                   -- Code
    'Teste DMT3',                                    -- Description
    13,                                         -- Order
    1,                                       -- HealthTypeExternalId (se aplicável)
    1,                                       -- HealthSpecialtyExternalId (se aplicável)
    1,                                          -- IsActive
    'Teste DMT3',                                       -- ShortDescription
    'DMT3',                                       -- CodeTM (se aplicável)
    1,                                          -- IsLocal
    NULL,                                       -- DefaultProfessionalId (se aplicável)
    NULL                                        -- DefaultOrganizationId (se aplicável)
);



-- =============================================
-- Template: Reabilitação Vocal (VOCAL-REHAB)
-- =============================================

INSERT INTO [dbo].[Template] ([Id] ,[Name] ,[IsShareable] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ProgramCode]) 
VALUES (
    NEWID() --id
    ,'Programa Teste 1' --name
    ,1 --isShareable
    ,1 --isActive
    ,'00000000-0000-0000-0000-000000000000' --createBy
    ,SYSDATETIMEOFFSET() --createDateTime
    ,'VOCAL-REHAB' --programCode
    );


-- =============================================
-- Biometric Parameters: Frequência cardíaca (HEARTRATE)
-- =============================================
GO
INSERT INTO [dbo].[TemplateBiometricParameter] ([Id] ,[Code] ,[Snomed] ,[CodeDataEntry] ,[IsRecurringMonitoring] ,[IsActive] ,[TemplateId] ,[DurationInDays] ,[ProgramCode] ,[ReceiveUnfulfilledAlerts], [AssessmentToolCode])
VALUES
(
    NEWID() --id
    ,'HEARTRATE' --code
    ,'' --snomed
    ,'' --codeDataEntry
    ,1 --isRecurringMonitoring
    ,1 --isActive
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
    ,365 --durationInDays
    ,'VOCAL-REHAB' --programCode
    ,0 --receiveUnfulfilledAlerts
    ,'IHEALTHOXIMETER' --AssessmentToolCode
);

--Periods
INSERT INTO [dbo].[TemplateBiometricParameterPeriod] ([Id] ,[Code] ,[TemplateBiometricParameterId] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,'DURING_EXERCISE' --code
    ,(SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --templateBiometricParameterId
    ,1 --isActive
    );

--Week days and hours
--Day 1 - 18:00 , 22:00
INSERT INTO [dbo].[TemplateBiometricParameterWeekDay] ([Id] ,[TemplateBiometricParameterId] ,[DayNumber] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --templateBiometricParameterId
    ,1 --dayNumber
    ,1 --isActive
    );
INSERT INTO [dbo].[TemplateBiometricParameterWeekDayTimer] ([Id] ,[TemplateBiometricParameterWeekDayId] ,[WeekDayStartTime] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateBiometricParameterWeekDay] [TBPW] WHERE [TBPW].[DayNumber] = 1 AND [TBPW].TemplateBiometricParameterId = (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB'))) ,'2026-01-01 18:00:00.0000000 +00:00' ,1);
INSERT INTO [dbo].[TemplateBiometricParameterWeekDayTimer] ([Id] ,[TemplateBiometricParameterWeekDayId] ,[WeekDayStartTime] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateBiometricParameterWeekDay] [TBPW] WHERE [TBPW].[DayNumber] = 1 AND [TBPW].TemplateBiometricParameterId = (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB'))) ,'2026-01-01 22:00:00.0000000 +00:00' ,1);

--Day 2 - 18:00
INSERT INTO [dbo].[TemplateBiometricParameterWeekDay] ([Id] ,[TemplateBiometricParameterId] ,[DayNumber] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --templateBiometricParameterId
    ,2 --dayNumber
    ,1 --isActive
    );
INSERT INTO [dbo].[TemplateBiometricParameterWeekDayTimer] ([Id] ,[TemplateBiometricParameterWeekDayId] ,[WeekDayStartTime] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateBiometricParameterWeekDay] [TBPW] WHERE [TBPW].[DayNumber] = 2 AND [TBPW].TemplateBiometricParameterId = (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB'))) ,'2026-01-01 18:00:00.0000000 +00:00' ,1);

--Day 3 - 18:00
INSERT INTO [dbo].[TemplateBiometricParameterWeekDay] ([Id] ,[TemplateBiometricParameterId] ,[DayNumber] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --templateBiometricParameterId
    ,3 --dayNumber
    ,1 --isActive
    );
INSERT INTO [dbo].[TemplateBiometricParameterWeekDayTimer] ([Id] ,[TemplateBiometricParameterWeekDayId] ,[WeekDayStartTime] ,[IsActive]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateBiometricParameterWeekDay] [TBPW] WHERE [TBPW].[DayNumber] = 3 AND [TBPW].TemplateBiometricParameterId = (SELECT [Id] FROM [dbo].[TemplateBiometricParameter] WHERE [Code] = 'HEARTRATE' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB'))) ,'2026-01-01 18:00:00.0000000 +00:00' ,1);


-- =============================================
-- Biometric Parameters: Saturação de oxigénio (PEROXYSAT)
-- =============================================
GO
INSERT INTO [dbo].[TemplateBiometricParameter] ([Id] ,[Code] ,[Snomed] ,[CodeDataEntry] ,[IsRecurringMonitoring] ,[IsActive] ,[TemplateId] ,[DurationInDays] ,[ProgramCode] ,[ReceiveUnfulfilledAlerts], [AssessmentToolCode])
VALUES
(
    NEWID() --id
    ,'PEROXYSAT' --code
    ,'' --snomed
    ,'' --codeDataEntry
    ,1 --isRecurringMonitoring
    ,1 --isActive
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
    ,365 --durationInDays
    ,'VOCAL-REHAB' --programCode
    ,0 --receiveUnfulfilledAlerts
    ,'IHEALTHOXIMETER' --AssessmentToolCode
);

----ETC ETC


-- =============================================
-- Biometric Parameters: Hidratación (WATERREINFORCE)
-- =============================================
GO
INSERT INTO [dbo].[TemplateBiometricParameter] ([Id] ,[Code] ,[Snomed] ,[CodeDataEntry] ,[IsRecurringMonitoring] ,[IsActive] ,[TemplateId] ,[DurationInDays] ,[ProgramCode] ,[ReceiveUnfulfilledAlerts], [AssessmentToolCode])
VALUES
(
    NEWID() --id
    ,'WATERREINFORCE' --code
    ,'' --snomed
    ,'' --codeDataEntry
    ,1 --isRecurringMonitoring
    ,1 --isActive
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
    ,365 --durationInDays
    ,'VOCAL-REHAB' --programCode
    ,0 --receiveUnfulfilledAlerts
    ,null --AssessmentToolCode
);


----ETC ETC


-- =============================================
-- Questionarios: Abusos e Maus Usos Vocais - Diário
-- =============================================
  Insert into [TemplateQuestionnaire] ([Id] ,[Code] ,[Description] ,[TemplateQuestionnaireCategoryId] ,[StartTime] ,[IsRecurringMonitoring] ,[IsActive] ,[ProgramCode] ,[TemplateId] ,[ProfessionalQuestionnaireId] ,[DurationInDays] ,[NumberOccurences] ,[EndTime] ,[ReceiveUnfulfilledAlerts] ,[Migrated]) 
  VALUES (
    NEWID() --id
    ,'Vocal_Abuse_Diary' --code
    ,'Abusos e Maus Usos Vocais - Diário' --description
    ,NULL --templateQuestionnaireCategoryId
    ,NULL --startTime
    ,1 --isRecurringMonitoring
    ,1 --isActive
    ,'VOCAL-REHAB' --programCode
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
    ,NULL --professionalQuestionnaireId
    ,182 --durationInDays
    ,NULL --numberOccurences
    ,NULL --endTime
    ,0 --receiveUnfulfilledAlerts
    ,0 --migrated
  );
  --Periods
INSERT INTO [dbo].[TemplateQuestionnairePeriod] ([Id] ,[Code] ,[TemplateQuestionnaireId] ,[IsActive]) 
VALUES (NEWID() --id
    ,'UNDEFINED' --code
    ,(SELECT [Id] FROM [TemplateQuestionnaire] WHERE [Code] = 'Vocal_Abuse_Diary') --templateQuestionnaireId
    ,1 --isActive
    );
  
--Weekdays and hours
--Day 1 - 20:00
  INSERT INTO [dbo].[TemplateQuestionnaireWeekDay]
  VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateQuestionnaire] WHERE [Code] = 'Vocal_Abuse_Diary' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --TemplateQuestionnaireId
    ,1 --dayNumber
    ,1 --isActive
  );

  INSERT INTO [dbo].[TemplateQuestionnaireWeekDayTimer]
  VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateQuestionnaireWeekDay] [TQWD] WHERE [TQWD].[DayNumber] = 1 AND [TQWD].TemplateQuestionnaireId = (SELECT [Id] FROM [dbo].[TemplateQuestionnaire] WHERE [Code] = 'Vocal_Abuse_Diary' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB'))) --TemplateQuestionnaireWeekDayId
    ,'2026-01-01 20:00:00.0000000 +00:00' --weekDayStartTime
    ,NULL --weekDayEndTime
    ,1 --isActive
  );
  ---resto de dias


-- =============================================
-- Questionarios: Abusos e Maus Usos Vocais - Diário
-- =============================================



-- =============================================
-- Exercicios: Reabilitação vocal
-- =============================================
INSERT INTO [dbo].[TemplatePhysicalRehabilitationPlan] ([Id] ,[TemplateId] ,[Description] ,[IsRecurringMonitoring] ,[DurationInDays] ,[NumberOccurrences] ,[StartTime] ,[EndTime] ,[ReceiveUnfulfilledAlerts] ,[IsActive] ,[ProgramCode]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
    ,'Reabilitação vocal' --description
    ,1 --isRecurringMonitoring
    ,182 --durationInDays
    ,NULL --numberOccurrences
    ,NULL --StartTime
    ,NULL --EndTime
    ,0 --receiveUnfulfilledAlerts
    ,1 --isActive
    ,'VOCAL-REHAB' --programCode
    );  

--Periods
INSERT INTO [dbo].[TemplatePhysicalRehabilitationPeriod] ([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[PeriodCode] ,[IsActive]) 
VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Reabilitação vocal') --templatePhysicalRehabilitationPlanId
    ,'NOSCHEDULE' --periodCode
    ,1 --isActive
    );

--Weekdays and hours
--Day 1 - 19:00
  INSERT INTO [dbo].[TemplatePhysicalRehabilitationWeekDay]
  VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Reabilitação vocal') --templatePhysicalRehabilitationPlanId
    ,1 --dayNumber
    ,1 --isActive
  );
  INSERT INTO [dbo].[TemplatePhysicalRehabilitationWeekDayTimer]
  VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationWeekDay] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Reabilitação vocal') --templatePhysicalRehabilitationWeekDayId
    ,'2026-01-01 19:00:00.0000000 +00:00' --weekDayStartTime
    ,NULL --weekDayEndTime
    ,1 --isActive
  );
--Day 2 - 17:00/20:00
--...etc

-- =============================================
-- Exercicios: Teste
-- =============================================
INSERT INTO [dbo].[TemplatePhysicalRehabilitationPlan] ([Id] ,[TemplateId] ,[Description] ,[IsRecurringMonitoring] ,[DurationInDays] ,[NumberOccurrences] ,[StartTime] ,[EndTime] ,[ReceiveUnfulfilledAlerts] ,[IsActive] ,[ProgramCode]) 
VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
    ,'Teste' --description
    ,1 --isRecurringMonitoring
    ,182 --durationInDays
    ,NULL --numberOccurrences
    ,NULL --StartTime
    ,NULL --EndTime
    ,0 --receiveUnfulfilledAlerts
    ,1 --isActive
    ,'VOCAL-REHAB' --programCode
    );  

INSERT INTO [dbo].[TemplatePhysicalRehabilitationPeriod] ([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[PeriodCode] ,[IsActive]) 
VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Teste') --templatePhysicalRehabilitationPlanId
    ,'BEFORE_EXERCISE' --periodCode
    ,1 --isActive
    );

-- =============================================
-- Educational Content Plans: Saúde Vocal
-- =============================================

INSERT INTO [dbo].[TemplateEducationalContentPlan] ([Id] ,[TemplateId] ,[Description], [DurationInDays] ,[ContentPerDay] ,[IsOrderMandatory] ,[IsActive], [ProgramCode])
VALUES (NEWID() --id
, (SELECT [Id] FROM [Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
, 'Saúde Vocal' --description
 ,182 --durationInDays
 ,2 --contentPerDay
 ,1 --isOrderMandatory
 ,1 --isActive
 , 'VOCAL-REHAB' --programCode
 );

  INSERT INTO [dbo].[TemplateEducationalContentPeriod] ([Id] ,[TemplateEducationalContentPlanId] ,[IsActive] ,[PeriodCode]) 
  VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --templateEducationalContentPlanId
    ,1 --isActive
    ,'BEFORE_EXERCISE' --periodCode
    );

  INSERT INTO [dbo].[TemplateEducationalContentWeekDay] ([Id] ,[TemplateEducationalContentPlanId] ,[DayNumber] ,[IsActive]) 
  VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentXPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --templateEducationalContentPlanId
    ,2 --dayNumber
    ,1 --isActive
    );

  INSERT INTO [dbo].[TemplateEducationalContentWeekDay] ([Id] ,[TemplateEducationalContentPlanId] ,[DayNumber] ,[IsActive]) 
  VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentXPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --templateEducationalContentPlanId
    ,3 --dayNumber
    ,1 --isActive
    );

  INSERT INTO [dbo].[TemplateEducationalContentWeekDay] ([Id] ,[TemplateEducationalContentPlanId] ,[DayNumber] ,[IsActive]) 
  VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentXPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --templateEducationalContentPlanId
    ,4 --dayNumber
    ,1 --isActive
    );

  INSERT INTO [dbo].[TemplateEducationalContentWeekDay] ([Id] ,[TemplateEducationalContentPlanId] ,[DayNumber] ,[IsActive]) 
  VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentXPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --templateEducationalContentPlanId
    ,5 --dayNumber
    ,1 --isActive
    );
    ---etc etc

-- =============================================
-- Educational Content Plans: Teste
-- =============================================

INSERT INTO [dbo].[TemplateEducationalContentPlan] ([Id] ,[TemplateId] ,[Description], [DurationInDays] ,[ContentPerDay] ,[IsOrderMandatory] ,[IsActive], [ProgramCode])
VALUES (NEWID() --id
, (SELECT [Id] FROM [Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
, 'Teste' --description
 ,365 --durationInDays
 ,5 --contentPerDay
 ,1 --isOrderMandatory
 ,1 --isActive
 , 'VOCAL-REHAB' --programCode
 );

  INSERT INTO [dbo].[TemplateEducationalContentWeekDay] ([Id] ,[TemplateEducationalContentPlanId] ,[DayNumber] ,[IsActive]) 
  ---...  etc etc 
