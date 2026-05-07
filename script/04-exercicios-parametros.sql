-- =============================================
-- Exercicios: Reabilitação vocal
-- =============================================
--ATENCION EN ADA COLUMNA PUEDEN HABER LA NECESIDAD DE CREAR VARIOS INSERTS DEPENDIENDO DE LOS VALORES DE SERIES, ITERATION, BREAK, WEIGHT Y MINUTES, cada que uno tenga un valore se creara un insert
INSERT INTO [dbo].[TemplatePhysicalRehabilitationItemParameter] VALUES (
  NEWID() --id
  ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationItem] WHERE [Code] = 'HYOID_BONE_MASSAGE' AND (SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Reabilitação vocal')) --TemplatePhysicalRehabilitationItemId
  ,'SERIES' --ParameterCode  - nombre de la columna el valor despues de "-" ex. Séries - Series (el valor sera SERIES)
  ,1 --Value --EL VALOR SERA EL NUMERO QUE ESTE EN LA COLUMNA 
  ,1 --Order --columna order
  ,1 --IsActive always true
);

INSERT INTO [dbo].[TemplatePhysicalRehabilitationItemParameter] VALUES (
  NEWID() --id
  ,(SELECT [Id] FROM [TemplatePhysicalRehabilitationItem] WHERE [Code] = 'HYOID_BONE_MASSAGE' AND (SELECT [Id] FROM [TemplatePhysicalRehabilitationPlan] WHERE [ProgramCode] = 'VOCAL-REHAB' AND [Description] = 'Reabilitação vocal')) --TemplatePhysicalRehabilitationItemId
  ,'MINUTES' --ParameterCode  - nombre de la columna el valor despues de "-" ex. Duação - MINUTES (el valor sera MINUTES)
  ,2 --Value --EL VALOR SERA EL NUMERO QUE ESTE EN LA COLUMNA 
  ,1 --Order --columna order
  ,1 --IsActive always true
);

