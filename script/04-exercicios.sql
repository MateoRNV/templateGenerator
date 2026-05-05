INSERT INTO [dbo].[TemplatePhysicalRehabilitationPlan] ([Id] ,[TemplateId] ,[Description] ,[IsRecurringMonitoring] ,[DurationInDays], [ReceiveUnfulfilledAlerts], [IsActive], [ProgramCode]) 
VALUES (
    NEWID() -- Id
    , (SELECT [Id] FROM [Template] WHERE [ProgramCode] = 'VOCAL-REHAB') -- Id do template
    ,'Reabilitação vocal' -- Descrição --prescripcao
    , 1 -- Se o plano é recorrente  --monitorizacao reocrrente
    , 365 -- Duração do plano em dias
    ,null --number ocorrences
    ,null --startTime
    ,null --endTime
    , 0 -- Se o paciente recebe alertas de não cumprimento
    , 1 -- Se o plano está ativo
    , 'VOCAL-REHAB' -- Código do programa
)
