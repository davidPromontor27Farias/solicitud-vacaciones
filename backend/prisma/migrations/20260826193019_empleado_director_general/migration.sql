-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "es_director_general" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "saldos_vacaciones_periodo_key" RENAME TO "saldos_vacaciones_empleado_id_inicio_validez_fecha_limite_d_key";
