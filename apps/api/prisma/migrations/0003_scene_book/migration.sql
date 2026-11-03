-- AlterTable
ALTER TABLE "Draft" ADD COLUMN "filmFinish" BOOLEAN NOT NULL DEFAULT false;

-- The six styles became new languages; "filme" is now a finish over any of them.
UPDATE "Draft" SET "filmFinish" = true, "styleId" = 'cinema' WHERE "styleId" = 'filme';
UPDATE "Draft" SET "styleId" = 'desenho' WHERE "styleId" IN ('editorial', 'linha', 'papel', 'noturno');

-- Manuscripts are now scene-by-scene. Older previews cannot be produced and are written again.
-- Drafts that already have an order keep theirs: the book pages read the cover from it.
DELETE FROM "Preview" WHERE "draftId" NOT IN (SELECT "draftId" FROM "Order");
UPDATE "Draft" SET "previewApproved" = false, "status" = 'draft'
  WHERE "status" IN ('previewing', 'preview_ready', 'approved')
    AND "id" NOT IN (SELECT "draftId" FROM "Order");
