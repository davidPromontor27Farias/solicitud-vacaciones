-- CreateEnum
CREATE TYPE "EstatusSolicitud" AS ENUM ('pendiente', 'aprobada', 'revocada', 'rechazada');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('solicitud_creada', 'aprobacion_empleado', 'aprobacion_nomina', 'aprobacion_jefe_matricial', 'revocacion');

-- CreateEnum
CREATE TYPE "EstatusEnvio" AS ENUM ('pendiente', 'enviado', 'fallido');

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "numero_empleado" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sociedad" TEXT,
    "puesto" TEXT,
    "departamento" TEXT,
    "correo_personal" TEXT,
    "password_hash" TEXT,
    "primer_acceso" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "recibe_notificaciones_matricial" BOOLEAN NOT NULL DEFAULT true,
    "jefe_directo_id" TEXT,
    "jefe_matricial_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldos_vacaciones" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "dias_por_ley" INTEGER NOT NULL,
    "dias_disfrutados" INTEGER NOT NULL DEFAULT 0,
    "dias_pendientes" INTEGER NOT NULL,
    "inicio_validez" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saldos_vacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_vacaciones" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "estatus" "EstatusSolicitud" NOT NULL DEFAULT 'pendiente',
    "backup_nombre" TEXT,
    "motivo_revocacion" TEXT,
    "revocado_por_id" TEXT,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelto_at" TIMESTAMP(3),

    CONSTRAINT "solicitudes_vacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_solicitados" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,

    CONSTRAINT "dias_solicitados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_activacion" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expira_at" TIMESTAMP(3) NOT NULL,
    "usado_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_activacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_email" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT,
    "tipo" "TipoNotificacion" NOT NULL,
    "destinatario" TEXT NOT NULL,
    "estatus_envio" "EstatusEnvio" NOT NULL DEFAULT 'pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_at" TIMESTAMP(3),

    CONSTRAINT "notificaciones_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleados_numero_empleado_key" ON "empleados"("numero_empleado");

-- CreateIndex
CREATE INDEX "empleados_jefe_directo_id_idx" ON "empleados"("jefe_directo_id");

-- CreateIndex
CREATE INDEX "empleados_jefe_matricial_id_idx" ON "empleados"("jefe_matricial_id");

-- CreateIndex
CREATE UNIQUE INDEX "saldos_vacaciones_empleado_id_key" ON "saldos_vacaciones"("empleado_id");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_empleado_id_idx" ON "solicitudes_vacaciones"("empleado_id");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_estatus_idx" ON "solicitudes_vacaciones"("estatus");

-- CreateIndex
CREATE INDEX "dias_solicitados_fecha_idx" ON "dias_solicitados"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "dias_solicitados_solicitud_id_fecha_key" ON "dias_solicitados"("solicitud_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_activacion_token_key" ON "tokens_activacion"("token");

-- CreateIndex
CREATE INDEX "notificaciones_email_solicitud_id_idx" ON "notificaciones_email"("solicitud_id");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_jefe_directo_id_fkey" FOREIGN KEY ("jefe_directo_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_jefe_matricial_id_fkey" FOREIGN KEY ("jefe_matricial_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldos_vacaciones" ADD CONSTRAINT "saldos_vacaciones_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_revocado_por_id_fkey" FOREIGN KEY ("revocado_por_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dias_solicitados" ADD CONSTRAINT "dias_solicitados_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_vacaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_activacion" ADD CONSTRAINT "tokens_activacion_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_email" ADD CONSTRAINT "notificaciones_email_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_vacaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
