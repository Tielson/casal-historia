-- AlterTable
ALTER TABLE "Draft" ADD COLUMN "storyMode" TEXT DEFAULT 'inspired';

-- AlterTable
ALTER TABLE "Preview" ADD COLUMN "manuscript" JSON;
ALTER TABLE "Preview" ADD COLUMN "sceneKeys" JSON;
ALTER TABLE "Preview" ADD COLUMN "imagesMock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Deliverable" ADD COLUMN "title" TEXT;
ALTER TABLE "Deliverable" ADD COLUMN "body" TEXT;
