  INSERT INTO [dbo].[TemplateBiometricParameterAlert]
   ([Id]
      ,[TemplateBiometricParameterId]
      ,[CodeSeverity]
      ,[GroupId]
      ,[Snomed]
      ,[IsActive]
      ,[TemplateId])
VALUES (NEWID() -- id
      ,(SELECT [Id] FROM [dbo].[BiometricParameter] WHERE [Code] = 'HEARTRATE' and programCode = 'VOCAL-REHAB') -- templateBiometricParameterId
      ,'BPOC_HIGH' -- codeSeverity
      ,NULL -- groupId
      ,NULL -- snomed
      ,1 -- isActive
      ,(SELECT [Id] FROM [dbo].[Template] WHERE [Code] = 'VOCAL-REHAB') -- templateId
); 

--HEARTRATE - BPOC_GREATER - 120
INSERT INTO [dbo].[TemplateItemBiometricParameterAlert]
   ([Id]
      ,[TemplateBiometricParameterAlertId]
      ,[CodeSnomed]
      ,[CodeAlertCondition]
      ,[Value]
      ,[IsActive]
      ,[Code])
VALUES (NEWID() -- id
      ,(SELECT [Id] FROM [dbo].[TemplateBiometricParameterAlert] WHERE [codeSeverity] = 'BPOC_HIGH' and [templateBiometricParameterId] = (SELECT [Id] FROM [dbo].[BiometricParameter] WHERE [Code] = 'HEARTRATE' and programCode = 'VOCAL-REHAB')) -- templateBiometricParameterAlertId
      ,NULL -- codeSnomed
      ,'BPOC_GREATER' -- codeAlertCondition
      ,120 -- value
      ,1 -- isActive
      ,NULL -- code
);


----esquema quest 


SELECT TOP (1000) [Id]
      ,[TemplateQuestionnaireId]
      ,[CodeSeverity]
      ,[GroupId]
      ,[TemplateId]
      ,[IsActive]
  FROM [dbo].[TemplateQuestionnaireAlert]

SELECT TOP (1000) [Id]
      ,[TemplateQuestionnaireAlertId]
      ,[CodeQuestion]
      ,[CodeAlertCondition]
      ,[CodeAnswer]
      ,[IsActive]
  FROM [dbo].[TemplateItemQuestionnaireAlert]