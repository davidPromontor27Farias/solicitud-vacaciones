-- CreateTable
CREATE TABLE "planificaciones_vacaciones" (
    "id" TEXT NOT NULL,
    "empleado_id" TEXT NOT NULL,
    "jefe_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "nota" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planificaciones_vacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planificaciones_vacaciones_jefe_id_idx" ON "planificaciones_vacaciones"("jefe_id");

-- CreateIndex
CREATE UNIQUE INDEX "planificaciones_vacaciones_empleado_id_fecha_key" ON "planificaciones_vacaciones"("empleado_id", "fecha");

-- AddForeignKey
ALTER TABLE "planificaciones_vacaciones" ADD CONSTRAINT "planificaciones_vacaciones_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planificaciones_vacaciones" ADD CONSTRAINT "planificaciones_vacaciones_jefe_id_fkey" FOREIGN KEY ("jefe_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
