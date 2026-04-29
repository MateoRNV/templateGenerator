INSERT INTO [dbo].[TemplatePhysicalRehabilitationPlan] ([Id] ,[TemplateId] ,[Description] ,[IsRecurringMonitoring] ,[DurationInDays], [ReceiveUnfulfilledAlerts], [IsActive], [ProgramCode]) 
VALUES (
    NEWID() -- Id
    , (SELECT [Id] FROM [Template] WHERE [ProgramCode] = 'VOCAL-REHAB') -- Id do template
    ,'Exercícios Diabetes perfil A' -- Descrição
    , 1 -- Se o plano é recorrente
    , 365 -- Duração do plano em dias
    , 0 -- Se o paciente recebe alertas de não cumprimento
    , 1 -- Se o plano está ativo
    , 'VOCAL-REHAB' -- Código do programa
)
