-- CreateTable
CREATE TABLE "MultiOutcomePosition" (
    "id" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeTitle" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "traderName" TEXT,
    "traderTier" "Tier" NOT NULL,
    "position" TEXT NOT NULL,
    "shares" DECIMAL(20,8) NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MultiOutcomePosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MultiOutcomePosition_eventSlug_computedAt_idx" ON "MultiOutcomePosition"("eventSlug", "computedAt");

-- CreateIndex
CREATE INDEX "MultiOutcomePosition_marketId_idx" ON "MultiOutcomePosition"("marketId");

-- CreateIndex
CREATE INDEX "MultiOutcomePosition_traderTier_idx" ON "MultiOutcomePosition"("traderTier");
