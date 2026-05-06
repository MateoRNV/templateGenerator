-- =============================================
-- Educational Content Plans: Saúde Vocal
-- =============================================
INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --planId    
    ,'SV_PC_C1' --code
    ,'1' --itemNumber
    ,1 --isActive
    );

INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Saúde Vocal') --planId
    ,'SV_PC_C2' --code
    ,'2' --itemNumber
    ,1 --isActive
    );

-- =============================================
-- Educational Content Plans: Teste
-- =============================================
INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Teste') --planId
    ,'test_content' --code
    ,'1' --itemNumber
    ,1 --isActive
    );