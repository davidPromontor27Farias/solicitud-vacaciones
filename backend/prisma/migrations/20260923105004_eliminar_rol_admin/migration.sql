-- Se elimina la distincion de roles de admin (lectura/nominas): el panel de "solo
-- lectura" (vacaciones criticas / dashboards) ya no se usa, asi que todos los admins
-- tienen ahora el mismo acceso.
ALTER TABLE "admins" DROP COLUMN "rol";
DROP TYPE "RolAdmin";
