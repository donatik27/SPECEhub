import { Queue } from 'bullmq';
import redis from './redis';

export const queues = {
  ingestion: new Queue('ingestion', { connection: redis }),
  scoring: new Queue('scoring', { connection: redis }),
  smartMarkets: new Queue('smart-markets', { connection: redis }),
};

export type JobType = 
  | 'sync-leaderboard'
  | 'sync-markets'
  | 'sync-trader-trades'
  | 'sync-trader-positions'
  | 'calculate-rarity-scores'
  | 'calculate-smart-markets';

export interface JobData {
  type: JobType;
  payload?: any;
}

