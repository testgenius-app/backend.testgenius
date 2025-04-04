-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'INVESTOR');

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "logo" TEXT,
    "coins" INTEGER NOT NULL,
    "last_active_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "packs" (
    "pack_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coinsCount" INTEGER NOT NULL DEFAULT 1,
    "discount_per_cent" INTEGER,
    "bonusCount" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "advantages" TEXT[],
    "disadvantages" TEXT[],
    "is_daily" BOOLEAN NOT NULL DEFAULT false,
    "is_free" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("pack_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
