import Redis from 'ioredis';
import { logger } from './logger';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info({ host: redisHost, port: redisPort }, 'Redis connected');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis connection error');
});

export default redis;

