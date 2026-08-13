-- CreateTable
CREATE TABLE "importaciones_correos_jefes" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "filas_leidas" INTEGER NOT NULL,
    "actualizados" INTEGER NOT NULL,
    "no_encontrados" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importaciones_correos_jefes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "importaciones_correos_jefes" ADD CONSTRAINT "importaciones_correos_jefes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
