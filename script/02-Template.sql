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
 ,1 --isOrderMandatory
 ,1 --isActive
 , 'VOCAL-REHAB' --programCode
 );
