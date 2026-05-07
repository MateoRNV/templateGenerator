-- =============================================
-- Novo questionário: Abusos e Maus Usos Vocais - Diário
-- =============================================
-- ###### Questão QUES0136: Durante o dia a sua voz:######## 
--Chaves de respostas si son nuevas (columna Chaves de resposta New)
--(Aqui todos los inserts de answer estan en una columna Chaves de resposta y seran necesarias solo si la columna de al lado Chaves de resposta New esta como sim, true o 1)
--el formato sera algo asi 0 - Piora - Worst, 1 - Melhora - Improvement, 2 - Não varia - Not Change donde 0 sera el value, Piora descripcion y shor description y worst el code
--el resto de datos seran fijos como createBy, createDateTime, modifyBy, modifyDateTime, endValue, score asi como el ejemplo
--en caso de que la columna Chaves de resposta New este como nao, false o 0 en ese caso NO creamos el insert en Answer y al asociarlas a la pregunta en QuestionAnswer 
--buscamos el answerId con el code en este caso de ejemplo worst
  Insert into Answer ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score]) 
  values (
    NEWID(), --id
    'WORST', --code
    'Piora', --description
    'Piora', --shortDescription
    0, --value
    null, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    null, --modifyDateTime
    null, --endValue
    null --score
  );

Insert into Answer ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score]) 
  values (
    NEWID(), --id
    'IMPROVEMENT', --code
    'Melhora', --description
    'Melhora', --shortDescription
    1, --value
    NULL, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    null, --modifyDateTime
    null, --endValue
    null --score
  );

    Insert into Answer ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score]) 
  values (
    NEWID(), --id
    'NOT_CHANGE', --code
    'Não varia', --description
    'Não varia', --shortDescription
    2, --value
    NULL, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    null, --modifyDateTime
    null, --endValue
    null --score
  );

  --Question
  Insert into Question ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[DataType] ,[Instructions] ,[ResponseKeyType] ,[MinValue] ,[MaxValue] ,[ParentQuestionId] ,[UseInCustomQuestionnaire] ,[Title]) 
  values (
    NEWID(), --id
    'QUES0136', --code -col = code questão
    'Durante o dia a sua voz: ', --description -- col =Description Questao
    'Durante o dia a sua voz: ', --shortDescription - col =Description Questao
    NULL, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    null, --modifyDateTime
    'STRING', --dataType  -- si responseKeyType es LIKERT = STRING si no es NUMERIC
    null, --instructions
    'LIKERT', --responseKeyType - col = Tipo
    NULL, --minValue
    NULL, --maxValue
    NULL, --ParentQuestionId
    1, --UseInCustomQuestionnaire - col = Ad-hoc (Carregar na pull de questões Sim =1 Não =0) si no tiene valores = 0
    'Hoje' --Title - col = Título questão - se no tiene puede estar en blanco 
  );

--Question Answer
INSERT INTO [dbo].[QuestionAnswer] ([Id], [QuestionId], [AnswerId], [Order], [IsActive], [CreateBy], [CreateDateTime], [ModifyBy], [ModifyDateTime])
VALUES (
    NEWID(), -- id
    (SELECT Id FROM Question WHERE Code = 'QUES0136'), -- questionId
    (SELECT Id FROM Answer WHERE Code = 'WORST'), -- answerId
    0, -- order --El mismo que el value en Answer (el numero de inicio)
    1, -- isActive
    '00000000-0000-0000-0000-000000000000', -- createBy
    SYSDATETIME(), -- createDateTime
    '00000000-0000-0000-0000-000000000000', -- modifyBy
    null -- modifyDateTime
);

GO

INSERT INTO [dbo].[QuestionAnswer] ([Id], [QuestionId], [AnswerId], [Order], [IsActive], [CreateBy], [CreateDateTime], [ModifyBy], [ModifyDateTime])
VALUES (
    NEWID(), -- id
    (SELECT Id FROM Question WHERE Code = 'QUES0136'), -- questionId
    (SELECT Id FROM Answer WHERE Code = 'IMPROVEMENT'), -- answerId
    1, -- order
    1, -- isActive
    '00000000-0000-0000-0000-000000000000', -- createBy
    SYSDATETIME(), -- createDateTime
    '00000000-0000-0000-0000-000000000000', -- modifyBy
    null -- modifyDateTime
);

GO

INSERT INTO [dbo].[QuestionAnswer] ([Id], [QuestionId], [AnswerId], [Order], [IsActive], [CreateBy], [CreateDateTime], [ModifyBy], [ModifyDateTime])
VALUES (
    NEWID(), -- id
    (SELECT Id FROM Question WHERE Code = 'QUES0136'), -- questionId
    (SELECT Id FROM Answer WHERE Code = 'NOT_CHANGE'), -- answerId
    2, -- order
    1, -- isActive
    '00000000-0000-0000-0000-000000000000', -- createBy
    SYSDATETIME(), -- createDateTime
    '00000000-0000-0000-0000-000000000000', -- modifyBy
    null -- modifyDateTime
);

GO

-- ###### Questão QUES0137: Se melhora (em que período)######## 
--Chaves de respostas si son nuevas (columna Chaves de resposta New)
--Questão 
--Asociacion entre questao y answer en QuestionAnswer

--..... lo mismo para todos las questoes que pertenezcan al cuestionario 
---despues con las questões creamos el cuestionario
--Professional Questionnaire
INSERT INTO [dbo].[ProfessionalQuestionnaire]([Id] ,[Description] ,[QuestionnaireCategoryId] ,[OrganizationId] ,[ProfessionalId] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[DeactivationDateTime] ,[DisabledBy] ,[Code] ,[IsVisible] ,[Context] ,[Instructions] ,[IconURL]) 
VALUES (
    NEWID() --id
    ,'Abusos e Maus Usos Vocais - Diário' --description columna = Questionario
    ,(SELECT Id FROM QuestionnaireCategory WHERE Code = 'PREDEFINED') --questionnaireCategoryId --Siempre sera predefined
    ,NULL --organizationId
    ,NULL --professionalId -- SIEMPRE NULL ORGANIZACION Y PROFESSIONAL
    ,1 --isActive
    ,'00000000-0000-0000-0000-000000000000' --createBy
    ,SYSDATETIME() --createDateTime
    ,NULL --modifyBy
    ,null --modifyDateTime
    ,null --deactivationDateTime
    ,null --disabledBy
    ,'Vocal_Abuse_Diary' --code
    ,1 --isVisible
    ,null --context
    ,'Este questionário foi construído de acordo com o programa de Reabilitação Vocal ele avalia sintomas relacionados com abusos e maus usos vocais como estado da sua voz ao longo do dia e período em que sofre alterações' --instructions -- columna = Instrução
    ,null --iconURL
);
--Professional Questionnaire Question
--y por ultimo la asociacion de question con el cuestionario
SELECT TOP (1000) [Id]
      ,[QuestionId]
      ,[ProfessionalQuestionnaireId]
      ,[IsActive]
      ,[CreateBy]
      ,[CreateDateTime]
      ,[Order]
      ,[QuestionNumber]
  FROM [dbo].[ProfessionalQuestionnaireQuestion]

Insert into [ProfessionalQuestionnaireQuestion] ([Id], [QuestionId], [ProfessionalQuestionnaireId], [IsActive], [CreateBy], [CreateDateTime], [Order], [QuestionNumber])
values (
    NEWID(), -- id
    (SELECT Id FROM Question WHERE Code = 'QUES0136'), -- questionId 
    (SELECT Id FROM ProfessionalQuestionnaire WHERE Code = 'Vocal_Abuse_Diary'), -- professionalQuestionnaireId
    1, -- isActive
    '00000000-0000-0000-0000-000000000000', -- createBy
    SYSDATETIME(), -- createDateTime
    136, -- order -columna = Ordem Questão
    '1' -- questionNumber -columna = QuestionNumber QuestionnaireQuestion
);  