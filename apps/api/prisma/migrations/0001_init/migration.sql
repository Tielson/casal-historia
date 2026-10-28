-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'occasion',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "occasion" TEXT,
    "nameA" TEXT,
    "nameB" TEXT,
    "photoAKey" TEXT,
    "photoBKey" TEXT,
    "photoTogetherKey" TEXT,
    "startDate" TEXT,
    "photoConsent" BOOLEAN NOT NULL DEFAULT false,
    "styleId" TEXT,
    "memoriesAnswers" JSON,
    "dedication" TEXT,
    "email" TEXT,
    "previewRegenCount" INTEGER NOT NULL DEFAULT 0,
    "previewApproved" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Photo_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "coverKey" TEXT,
    "pageKey" TEXT,
    "coverText" TEXT,
    "pageText" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Preview_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'brl',
    "email" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "productionStage" TEXT,
    "productionError" TEXT,
    "reprocessCount" INTEGER NOT NULL DEFAULT 0,
    "pdfKey" TEXT,
    "manageToken" TEXT NOT NULL,
    "giftToken" TEXT NOT NULL,
    "giftRevoked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "paidAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "pageIndex" INTEGER,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deliverable_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rawType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "draftId" TEXT,
    "kind" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "meta" JSON,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GenerationJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "draftId" TEXT,
    "orderId" TEXT,
    "clientId" TEXT,
    "path" TEXT,
    "meta" JSON,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FunnelEvent_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Draft_token_key" ON "Draft"("token");

-- CreateIndex
CREATE INDEX "Photo_draftId_idx" ON "Photo"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_draftId_role_key" ON "Photo"("draftId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Preview_draftId_key" ON "Preview"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_draftId_key" ON "Order"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentId_key" ON "Order"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_manageToken_key" ON "Order"("manageToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_giftToken_key" ON "Order"("giftToken");

-- CreateIndex
CREATE INDEX "Deliverable_orderId_idx" ON "Deliverable"("orderId");

-- CreateIndex
CREATE INDEX "Deliverable_orderId_kind_idx" ON "Deliverable"("orderId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeEventId_key" ON "Payment"("stripeEventId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "GenerationJob_draftId_idx" ON "GenerationJob"("draftId");

-- CreateIndex
CREATE INDEX "GenerationJob_orderId_idx" ON "GenerationJob"("orderId");

-- CreateIndex
CREATE INDEX "FunnelEvent_name_idx" ON "FunnelEvent"("name");

-- CreateIndex
CREATE INDEX "FunnelEvent_createdAt_idx" ON "FunnelEvent"("createdAt");

