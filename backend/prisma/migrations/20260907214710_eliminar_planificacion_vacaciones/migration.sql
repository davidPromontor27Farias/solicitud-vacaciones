/*
  Warnings:

  - You are about to drop the `planificaciones_vacaciones` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "planificaciones_vacaciones" DROP CONSTRAINT "planificaciones_vacaciones_empleado_id_fkey";

-- DropForeignKey
ALTER TABLE "planificaciones_vacaciones" DROP CONSTRAINT "planificaciones_vacaciones_jefe_id_fkey";

-- DropTable
DROP TABLE "planificaciones_vacaciones";
