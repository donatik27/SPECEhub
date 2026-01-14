import { Worker } from 'bullmq';
import redis from '../lib/redis';
import { logger } from '../lib/logger';
import { JobData } from '../lib/queue';
import { handleIngestionJob } from './ingestion.worker';
import { handleScoringJob } from './scoring.worker';
import { handleSmartMarketsJob } from './smart-markets.worker';

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

export async function startWorkers() {
  // Ingestion worker
  const ingestionWorker = new Worker(
    'ingestion',
    async (job) => {
      const data = job.data as JobData;
      logger.info({ jobId: job.id, type: data.type }, 'Processing ingestion job');
      await handleIngestionJob(data);
      logger.info({ jobId: job.id, type: data.type }, 'Completed ingestion job');
    },
    {
      connection: redis,
      concurrency: CONCURRENCY,
    }
  );

  ingestionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Ingestion job failed');
  });

  // Scoring worker
  const scoringWorker = new Worker(
    'scoring',
    async (job) => {
      const data = job.data as JobData;
      logger.info({ jobId: job.id, type: data.type }, 'Processing scoring job');
      await handleScoringJob(data);
      logger.info({ jobId: job.id, type: data.type }, 'Completed scoring job');
    },
    {
      connection: redis,
      concurrency: CONCURRENCY,
    }
  );

  scoringWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Scoring job failed');
  });

  // Smart markets worker
  const smartMarketsWorker = new Worker(
    'smart-markets',
    async (job) => {
      const data = job.data as JobData;
      logger.info({ jobId: job.id, type: data.type }, 'Processing smart markets job');
      await handleSmartMarketsJob(data);
      logger.info({ jobId: job.id, type: data.type }, 'Completed smart markets job');
    },
    {
      connection: redis,
      concurrency: CONCURRENCY,
    }
  );

  smartMarketsWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Smart markets job failed');
  });

  return { ingestionWorker, scoringWorker, smartMarketsWorker };
}

