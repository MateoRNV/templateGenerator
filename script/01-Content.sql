Insert Into EducationalContent.[Item] ([Id], [Title], [Code], [CategoryId], [Description], [ImageURL], [IsActive], [CreateDateTime], [ModifyDateTime], [Objective], [Order], [CreateDateTimeOld], [ModifyDateTimeOld]) VALUES (
    NEWID() -- Id
    ,'Conhecer a importância da medicação' -- Title
    ,'PCAA_1.19' -- Code
    ,'02F1A27D-56A3-432D-8A03-CEB73FE3B083' -- CategoryId --select id from EducationalContent.Category where code = 'DIABETES_KNOWLEDGE'
    ,'A diabetes é uma doença crónica, que exige a administração de medicação em comprimidos e/ou de insulina injetável. A toma adequada da medicação é essencial para melhorar o controlo da diabetes. A estabilidade da diabetes permite reduzir as doses e a quantidade de medicamentos ingeridos.' -- Description
    ,NULL -- ImageURL
    ,1 -- IsActive
    ,SYSDATETIME() -- CreateDateTime
    ,NULL -- ModifyDateTime
    ,'Aumentar o conhecimento sobre a diabetes' -- Objective
    ,3 -- Order
    ,SYSDATETIME() -- CreateDateTimeOld
    ,NULL -- ModifyDateTimeOld
 );