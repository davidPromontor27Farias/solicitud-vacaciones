/*
  Warnings:

  - Added the required column `fecha_limite_disfrute` to the `saldos_vacaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fin_validez` to the `saldos_vacaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "backup_nombre" TEXT;

-- AlterTable
ALTER TABLE "saldos_vacaciones" ADD COLUMN     "fecha_limite_disfrute" DATE,
ADD COLUMN     "fin_validez" DATE;

UPDATE "saldos_vacaciones" SET "fecha_limite_disfrute" = "fecha_vencimiento" WHERE "fecha_limite_disfrute" IS NULL;
UPDATE "saldos_vacaciones" SET "fin_validez" = "fecha_vencimiento" WHERE "fin_validez" IS NULL;

ALTER TABLE "saldos_vacaciones" ALTER COLUMN "fecha_limite_disfrute" SET NOT NULL;
ALTER TABLE "saldos_vacaciones" ALTER COLUMN "fin_validez" SET NOT NULL;
