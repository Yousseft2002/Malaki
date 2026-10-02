-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateIndex
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");

