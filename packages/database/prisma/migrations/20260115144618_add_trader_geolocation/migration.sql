-- AlterTable
ALTER TABLE "Trader" ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Trader_country_idx" ON "Trader"("country");
