-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('S', 'A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('OPEN', 'CLOSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "Trader" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'E',
    "rarityScore" INTEGER NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "totalPnl" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Trader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT,
    "endDate" TIMESTAMP(3),
    "liquidity" DECIMAL(20,8),
    "volume" DECIMAL(20,8),
    "status" "MarketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "size" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(10,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionSnapshot" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "shares" DECIMAL(20,8) NOT NULL,
    "avgPrice" DECIMAL(10,8) NOT NULL,
    "pnlEst" DECIMAL(20,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSmartStats" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "smartCount" INTEGER NOT NULL DEFAULT 0,
    "smartWeighted" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "smartShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smartScore" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "topSmartTraders" JSONB,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "pinnedAt" TIMESTAMP(3),
    "lastChecked" TIMESTAMP(3),

    CONSTRAINT "MarketSmartStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionState" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "cursor" TEXT,
    "lastTimestamp" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trader_address_key" ON "Trader"("address");

-- CreateIndex
CREATE INDEX "Trader_tier_rarityScore_idx" ON "Trader"("tier", "rarityScore");

-- CreateIndex
CREATE INDEX "Trader_totalPnl_idx" ON "Trader"("totalPnl");

-- CreateIndex
CREATE INDEX "Trader_lastActiveAt_idx" ON "Trader"("lastActiveAt");

-- CreateIndex
CREATE INDEX "Market_status_category_idx" ON "Market"("status", "category");

-- CreateIndex
CREATE INDEX "Market_endDate_idx" ON "Market"("endDate");

-- CreateIndex
CREATE INDEX "Trade_traderId_timestamp_idx" ON "Trade"("traderId", "timestamp");

-- CreateIndex
CREATE INDEX "Trade_marketId_timestamp_idx" ON "Trade"("marketId", "timestamp");

-- CreateIndex
CREATE INDEX "Trade_timestamp_idx" ON "Trade"("timestamp");

-- CreateIndex
CREATE INDEX "PositionSnapshot_traderId_marketId_timestamp_idx" ON "PositionSnapshot"("traderId", "marketId", "timestamp");

-- CreateIndex
CREATE INDEX "PositionSnapshot_timestamp_idx" ON "PositionSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "MarketSmartStats_marketId_computedAt_idx" ON "MarketSmartStats"("marketId", "computedAt");

-- CreateIndex
CREATE INDEX "MarketSmartStats_smartScore_idx" ON "MarketSmartStats"("smartScore");

-- CreateIndex
CREATE INDEX "MarketSmartStats_isPinned_priority_idx" ON "MarketSmartStats"("isPinned", "priority");

-- CreateIndex
CREATE INDEX "IngestionState_source_idx" ON "IngestionState"("source");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionState_source_key_key" ON "IngestionState"("source", "key");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSmartStats" ADD CONSTRAINT "MarketSmartStats_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
