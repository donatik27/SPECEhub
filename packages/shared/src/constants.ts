export const TIER_THRESHOLDS = {
  S: 0.001, // top 0.1%
  A: 0.01,  // next 0.9% (top 1%)
  B: 0.05,  // next 4% (top 5%)
  C: 0.20,  // next 15% (top 20%)
  D: 0.50,  // next 30% (top 50%)
  E: 1.00,  // rest
} as const;

export const SCORING_WEIGHTS = {
  realizedPnl: 0.40,
  winRate: 0.20,
  profitFactor: 0.15,
  stability: 0.15,
  drawdown: 0.10,
} as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

