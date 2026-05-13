
INSERT INTO [dbo].[ClinicalDataType]
([Id], [Code], [Loinc], [Snomed], [Description], [ClinicalDataCategoryId], [DataType], [MinValue], [MaxValue], [IncrementValue], [ValueMask], [Order], [AggregationCode], [Formula], [IsCrossSectionalData], [IsActive], [MeasurementUnit], [ShortDescription], [ChartIncrementValue], [ChartIncrementPrecision], [IsChart], [ClinicalDataTypeGroupId], [ValuePrecision])
VALUES (
    NEWID(),    -- Id
    'WATERREINFORCE',                                   -- Code
    NULL,                                       -- Loinc
    NULL,                                       -- Snomed
    'Reforço Hídrico',                                    -- Description
    '454B62F2-8729-4AED-9708-76BB45AADC9B',    -- ClinicalDataCategoryId --select id from ClinicalDataCategory where code = 'COMPCORP'
    'DECIMAL',                              -- DataType
    CAST(0.00 AS Decimal(19, 6)),           -- MinValue
    CAST(500.00 AS Decimal(19, 6)),         -- MaxValue
    CAST(10 AS Decimal(19, 6)),           -- IncrementValue
    NULL,                                       -- ValueMask
    5,                                         -- Order
    NULL,                                       -- AggregationCode
    NULL,                                       -- Formula
    0,                                          -- IsCrossSectionalData
    1,                                          -- IsActive
    'ml',                                       -- MeasurementUnit
    'Reforço Hídrico',                                       -- ShortDescription
    CAST(200 AS Decimal(19, 6)),           -- ChartIncrementValue
    NULL,                                       -- ChartIncrementPrecision
    NULL,                                       -- IsChart
    NULL,                                       -- ClinicalDataTypeGroupId
    0                                           -- ValuePrecision
);

GO

USE [DbTeleHealthIntegratedCare]
GO
DECLARE @Code nvarchar(32) = 'WATERREINFORCE';

IF NOT EXISTS (SELECT * FROM [dbo].[BiometricParameter] [BP]
				WHERE [BP].[ClinicalDataTypeId] = (SELECT TOP (1) [Id] FROM [dbo].[ClinicalDataType] WHERE [Code] = @Code))
BEGIN
	INSERT INTO [dbo].[BiometricParameter]
		([Id]
		 ,[ClinicalDataTypeId]
		 ,[IsActive])
	VALUES (
		(SELECT TOP (1) [Id] FROM [dbo].[ClinicalDataType] WHERE [Code] = @Code)
		,(SELECT TOP (1) [Id] FROM [dbo].[ClinicalDataType] WHERE [Code] = @Code)
		,1)
END


USE [DbTeleHealthIntegratedCare]
GO
DECLARE @Code NVARCHAR(32) = 'WATERREINFORCE';

INSERT INTO [dbo].[BiometricParameterAlertClinicalDataType]
	SELECT NEWID()
		,[BP].[Id]
		,[BP].[ClinicalDataTypeId]
		,1
	FROM [dbo].[BiometricParameter] [BP] WHERE [BP].[ClinicalDataTypeId] = (SELECT TOP (1) [Id]
			FROM [dbo].[ClinicalDataType] WHERE [Code] = @Code)
GO


