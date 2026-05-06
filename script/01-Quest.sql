-- =============================================
-- Novo questionário Abusos e Maus Usos Vocais - Diário
-- =============================================
-- ###### 1 ######## 
--Chaves de respostas
  Insert into Answer ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score]) 
  values (
    NEWID(), --id
    'WORST', --code
    'Piora', --description
    'Piora', --shortDescription
    1, --value
    1, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    SYSDATETIME(), --modifyDateTime
    1, --endValue
    0 --score
  );

Insert into Answer ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score]) 
  values (
    NEWID(), --id
    'IMPROVEMENT', --code
    'Melhora', --description
    'Melhora', --shortDescription
    1, --value
    1, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    SYSDATETIME(), --modifyDateTime
    1, --endValue
    1 --score
  );

    Insert into Answer ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Value] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[EndValue] ,[Score]) 
  values (
    NEWID(), --id
    'NOT_CHANGE', --code
    'Não varia', --description
    'Não varia', --shortDescription
    1, --value
    1, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    SYSDATETIME(), --modifyDateTime
    1, --endValue
    2 --score
  );
  --pregunta
  Insert into Question ([Id] ,[Code] ,[Description] ,[ShortDescription] ,[Order] ,[IsActive] ,[CreateBy] ,[CreateDateTime] ,[ModifyBy] ,[ModifyDateTime] ,[DataType] ,[Instructions] ,[ResponseKeyType] ,[MinValue] ,[MaxValue] ,[ParentQuestionId] ,[UseInCustomQuestionnaire] ,[Title]) 
  values (
    NEWID(), --id
    'QUES0136', --code - SELECT del ultimo code inserrio +1 devera devolver 'QUES0137' el code de la tabla Question
    'Durante o dia a sua voz: ', --description
    'Durante o dia a sua voz: ', --shortDescription
    1, --order
    1, --isActive
    '00000000-0000-0000-0000-000000000000', --createBy
    SYSDATETIME(), --createDateTime
    '00000000-0000-0000-0000-000000000000', --modifyBy
    SYSDATETIME(), --modifyDateTime
    'String', --dataType
    null, --instructions
    'LIKERT', --responseKeyType
    NULL, --minValue
    NULL, --maxValue
    NULL, --ParentQuestionId
    1, --UseInCustomQuestionnaire
    'Hoje' --Title
  );
