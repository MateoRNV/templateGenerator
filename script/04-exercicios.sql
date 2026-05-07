-- =============================================
-- Exercicios: Reabilitação vocal
-- =============================================
Insert INTO [dbo].[TemplatePhysicalRehabilitationItem]([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[PhysicalExerciseCode] ,[Order] ,[Instructions] ,[IsActive]) 
VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Reabilitação vocal') --templatePhysicalRehabilitationPlanId
    ,'HYOID_BONE_MASSAGE' --physicalExerciseCode
    ,1 --order
    ,'"Encontre o osso hióide logo abaixo do queixo. Mantenha os dedos em ambos os lados doosso hioide.
Massaje com movimentos circulares e uma ligeira pressão."' --instructions
    ,1 --isActive
);


-- =============================================
-- Exercicios: Teste
-- =============================================

Insert INTO [dbo].[TemplatePhysicalRehabilitationItem]([Id] ,[TemplatePhysicalRehabilitationPlanId] ,[PhysicalExerciseCode] ,[Order] ,[Instructions] ,[IsActive]) 
VALUES (NEWID() --id
    ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'TESTE' AND [Description] = 'Teste') --templatePhysicalRehabilitationPlanId
    ,'test' --physicalExerciseCode
    ,1 --order
    ,'Teste' --instructions
    ,1 --isActive
);
