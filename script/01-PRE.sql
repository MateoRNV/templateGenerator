  
INSERT INTO [dbo].[PRePhysicalExercise] ([Id], [Code], [Description], [ShortDescription], [Image], [ImagePath], [IsActive], [CreateBy], [CreateDateTime], [ModifyBy], [ModifyDateTime], [Order], [Objective], [Instructions], [ImageURL], [IconURL], [CreateDateTimeOld], [ModifyDateTimeOld])
 VALUES (
    NEWID() -- id
    ,'HYOID_BONE_MASSAGE' -- code
    ,'Massagem do osso hioide' -- description
    ,'Massagem do osso hioide' -- shortDescription
    ,NULL -- image
    ,NULL -- imagePath
    ,1 -- isActive
    ,'00000000-0000-0000-0000-000000000000' -- createBy
    ,SYSDATETIME() -- createDateTime
    ,'00000000-0000-0000-0000-000000000000' -- modifyBy
    ,SYSDATETIME() -- modifyDateTime
    ,1 -- order
    ,'Melhorar a tensão muscular na região da laringe ou tensão vocal' -- objective
    ,'Encontre o osso hióide logo abaixo do queixo. Mantenha os dedos em ambos os lados doosso hioide. Massaje com movimentos circulares e uma ligeira pressão.' -- instructions
    ,NULL -- imageURL
    ,NULL -- iconURL
    ,NULL -- createDateTimeOld
    ,NULL -- modifyDateTimeOld
 );   