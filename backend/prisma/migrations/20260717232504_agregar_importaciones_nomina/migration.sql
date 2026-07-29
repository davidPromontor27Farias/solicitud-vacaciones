-- CreateTable
CREATE TABLE "importaciones_nomina" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "filas_leidas" INTEGER NOT NULL,
    "empleados_creados" INTEGER NOT NULL,
    "empleados_actualizados" INTEGER NOT NULL,
    "periodos_creados" INTEGER NOT NULL,
    "periodos_actualizados" INTEGER NOT NULL,
    "jefes_no_resueltos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importaciones_nomina_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "importaciones_nomina" ADD CONSTRAINT "importaciones_nomina_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
