-- CreateEnum
CREATE TYPE "Providers" AS ENUM ('GOOGLE', 'EMAIL', 'FACEBOOK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "Providers" NOT NULL DEFAULT 'EMAIL';
