-- Un periodo de vacaciones se identifica por (empleado, inicio de validez, fecha limite
-- para disfrutar): SAP puede reportar dos tramos con la misma vigencia pero contingentes
-- que vencen en fechas distintas, y antes se fusionaban por error al compartir inicio_validez.
DROP INDEX "saldos_vacaciones_empleado_id_inicio_validez_key";

CREATE UNIQUE INDEX "saldos_vacaciones_periodo_key" ON "saldos_vacaciones"("empleado_id", "inicio_validez", "fecha_limite_disfrute");
