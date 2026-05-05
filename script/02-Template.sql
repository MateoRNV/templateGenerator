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


INSERT INTO [dbo].[TemplateEducationalContentPlan] ([Id] ,[TemplateId] ,[Description], [DurationInDays] ,[ContentPerDay] ,[IsOrderMandatory] ,[IsActive], [ProgramCode])
VALUES (NEWID() --id
, (SELECT [Id] FROM [Template] WHERE [ProgramCode] = 'VOCAL-REHAB') --templateId
, 'Pack Standard VOCAL-REHAB' --description
 ,365 --durationInDays
 ,2 --contentPerDay
 ,0 --isOrderMandatory
 ,1 --isActive
 , 'VOCAL-REHAB' --programCode (el mismo que el programa recien creado)
 );
