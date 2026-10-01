-- AlterEnum
ALTER TYPE "TipoNotificacion" ADD VALUE 'aprobacion_parcial_empleado';

-- AlterTable
ALTER TABLE "dias_solicitados" ADD COLUMN     "rechazado_at" TIMESTAMP(3);
