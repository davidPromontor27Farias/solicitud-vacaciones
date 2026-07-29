-- CreateEnum
CREATE TYPE "RolAdmin" AS ENUM ('lectura', 'nominas');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "rol" "RolAdmin" NOT NULL DEFAULT 'lectura';
