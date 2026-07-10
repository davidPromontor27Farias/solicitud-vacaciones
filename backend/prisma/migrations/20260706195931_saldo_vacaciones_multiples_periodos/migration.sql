/*
  Warnings:

  - A unique constraint covering the columns `[empleado_id,inicio_validez]` on the table `saldos_vacaciones` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "saldos_vacaciones_empleado_id_key";

-- CreateIndex
CREATE INDEX "saldos_vacaciones_empleado_id_idx" ON "saldos_vacaciones"("empleado_id");

-- CreateIndex
CREATE UNIQUE INDEX "saldos_vacaciones_empleado_id_inicio_validez_key" ON "saldos_vacaciones"("empleado_id", "inicio_validez");
