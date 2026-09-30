-- CreateEnum
CREATE TYPE "EstatusAusentismo" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "MotivoAusentismo" AS ENUM ('permiso_sin_goce', 'permiso_con_goce', 'home_office', 'tiempo_por_tiempo', 'permiso_interno_salud', 'permiso_salida', 'permiso_entrada');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoNotificacion" ADD VALUE 'ausentismo_creado';
ALTER TYPE "TipoNotificacion" ADD VALUE 'ausentismo_aprobado_empleado';
ALTER TYPE "TipoNotificacion" ADD VALUE 'ausentismo_rechazado_empleado';
ALTER TYPE "TipoNotificacion" ADD VALUE 'ausentismo_aprobado_nominas';
ALTER TYPE "TipoNotificacion" ADD VALUE 'ausentismo_rechazado_nominas';

-- AlterTable
ALTER TABLE "notificaciones_email" ADD COLUMN     "ausentismo_id" TEXT;

-- CreateTable
CREATE TABLE "ausentismos" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "motivo" "MotivoAusentismo" NOT NULL,
    "comentario" TEXT NOT NULL,
    "estatus" "EstatusAusentismo" NOT NULL DEFAULT 'pendiente',
    "motivo_rechazo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelto_at" TIMESTAMP(3),

    CONSTRAINT "ausentismos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_ausentismo" (
    "id" TEXT NOT NULL,
    "ausentismo_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,

    CONSTRAINT "dias_ausentismo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ausentismos_empleado_id_idx" ON "ausentismos"("empleado_id");

-- CreateIndex
CREATE INDEX "ausentismos_estatus_idx" ON "ausentismos"("estatus");

-- CreateIndex
CREATE INDEX "dias_ausentismo_fecha_idx" ON "dias_ausentismo"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "dias_ausentismo_ausentismo_id_fecha_key" ON "dias_ausentismo"("ausentismo_id", "fecha");

-- CreateIndex
CREATE INDEX "notificaciones_email_ausentismo_id_idx" ON "notificaciones_email"("ausentismo_id");

-- AddForeignKey
ALTER TABLE "notificaciones_email" ADD CONSTRAINT "notificaciones_email_ausentismo_id_fkey" FOREIGN KEY ("ausentismo_id") REFERENCES "ausentismos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausentismos" ADD CONSTRAINT "ausentismos_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dias_ausentismo" ADD CONSTRAINT "dias_ausentismo_ausentismo_id_fkey" FOREIGN KEY ("ausentismo_id") REFERENCES "ausentismos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
