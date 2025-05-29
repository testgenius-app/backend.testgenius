-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('TEST', 'ONLINE_TEST', 'SECTION', 'TASK', 'QUESTION', 'USER');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'START', 'COMPLETE', 'SHARE', 'JOIN', 'LEAVE');

-- CreateTable
CREATE TABLE "activities" (
    "activity_id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "actor_id" TEXT NOT NULL,
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("activity_id")
);

-- CreateIndex
CREATE INDEX "activities_entityType_idx" ON "activities"("entityType");

-- CreateIndex
CREATE INDEX "activities_actionType_idx" ON "activities"("actionType");

-- CreateIndex
CREATE INDEX "activities_entity_id_idx" ON "activities"("entity_id");

-- CreateIndex
CREATE INDEX "activities_actor_id_idx" ON "activities"("actor_id");

-- CreateIndex
CREATE INDEX "activities_target_id_idx" ON "activities"("target_id");

-- CreateIndex
CREATE INDEX "activities_created_at_idx" ON "activities"("created_at");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
