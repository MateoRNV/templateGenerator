INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = 'VOCAL-REHAB') --planId
    ,'SV_PC_C1' --code
    ,'1' --itemNumber
    ,1 --isOptional
    );

INSERT INTO [dbo].[TemplateEducationalContentItem] VALUES (
    NEWID() --id
    ,(SELECT [Id] FROM [TemplateEducationalContentPlan] WHERE [ProgramCode] = 'VOCAL-REHAB') --planId
    ,'SV_PC_C2' --code
    ,'2' --itemNumber
    ,1 --isOptional
    );