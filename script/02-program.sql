BEGIN TRY
    BEGIN TRANSACTION;


INSERT INTO [dbo].[Program]
 ([Id] ,[Code] ,[Description] ,[Order] ,[HealthTypeExternalId] ,[HealthSpecialtyExternalId] ,[IsActive] ,[ShortDescription] ,[CodeTM] ,[IsLocal] ,[DefaultProfessionalId] ,[DefaultOrganizationId])
VALUES (
    NEWID() -- Id (será gerado automaticamente)
    ,'VOCAL-REHAB' -- Code
    ,'Reabilitação Vocal' -- Description
    ,3 -- Order
    1,                                       -- HealthTypeExternalId (se aplicável)
    1,                                       -- HealthSpecialtyExternalId (se aplicável)
    1,                                          -- IsActive
    'Reabilitação Vocal',                                       -- ShortDescription
    'VOCAL-REHAB',                                       -- CodeTM
    1,                                          -- IsLocal
    NULL,                                       -- DefaultProfessionalId (se aplicável)
    NULL                                        -- DefaultOrganizationId (se aplicável)
);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (XACT_STATE()) <> 0
        ROLLBACK TRANSACTION;
    -- THROW; -- para relançar o erro original
END CATCH;

GO  


  INSERT INTO [healthmonitoring].[ClinicalDataType]
   ([Id]
      ,[Code]
      ,[Description]
      ,[Unit]
      ,[IsActive]
      ,[SNOMED]
      ,[PreferredTermEN]
      ,[ShortDescription]
      ,[MinValue]
      ,[MaxValue]
      ,[CreateBy]
      ,[CreateDateTime]
      ,[ModifyBy]
      ,[ModifyDateTime]
      ,[TMCode]
      ,[ClinicalDataTypeGroupId]
      ,[CreateDateTimeOld]
      ,[ModifyDateTimeOld])
VALUES (    '31A4DB5E-88D3-40C7-9249-5CE15697058F', -- id
    'WATERREINFORCE', -- code
    'Reforço hidríco', -- description
    'Hz', -- unit
    1, -- isActive
    NULL, -- snomed
    NULL, -- preferredTermEN
    'Reforço hidríco', -- shortDescription
    0, -- minValue
    5000, -- maxValue
    '00000000-0000-0000-0000-000000000000', -- createBy
    SYSDATETIME(), -- createDateTime
    NULL, -- modifyBy
    NULL, -- modifyDateTime
    NULL, -- tmCode
    NULL, -- clinicalDataTypeGroupId
    SYSDATETIME(), -- createDateTimeOld
    NULL  -- modifyDateTimeOld
);