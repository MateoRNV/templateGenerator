-- =============================================
-- Questionarios: Vocal_Abuse_Diary
-- =============================================
INSERT INTO [dbo].[TemplateQuestion] VALUES (
  NEWID() --id
  ,'QUES0136' --code
  ,(SELECT [Id] FROM [TemplateQuestionnaire] WHERE [Code] = 'Vocal_Abuse_Diary' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --TemplateQuestionnaireId
  ,1 --isActive
  );
  

INSERT INTO [dbo].[TemplateQuestion] VALUES (
  NEWID() --id
  ,'QUES0137' --code
  ,(SELECT [Id] FROM [TemplateQuestionnaire] WHERE [Code] = 'Vocal_Abuse_Diary' AND [TemplateId] = (SELECT [Id] FROM [dbo].[Template] WHERE [ProgramCode] = 'VOCAL-REHAB')) --TemplateQuestionnaireId
  ,1 --isActive
  );