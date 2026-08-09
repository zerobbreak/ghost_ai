-- DropIndex
DROP INDEX "projects_owner_id_idx";

-- DropIndex
DROP INDEX "projects_created_at_idx";

-- CreateIndex
CREATE INDEX "projects_owner_id_created_at_idx" ON "projects"("owner_id", "created_at");