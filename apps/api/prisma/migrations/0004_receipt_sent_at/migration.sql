-- Payment receipt is sent once, as soon as the order is paid.
ALTER TABLE "Order" ADD COLUMN "receiptSentAt" DATETIME;
