import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { HealthStatus } from '@polymarket/shared';

@Injectable()
export class HealthService {
  constructor(private readonly db: DatabaseService) {}

  async getHealth(): Promise<HealthStatus> {
    let databaseHealthy = false;
    let redisHealthy = true; // TODO: Add Redis check when implemented

    try {
      await this.db.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Get last ingestion times
    const ingestionStates = await this.db.ingestionState.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const lastIngestion = {
      leaderboard: ingestionStates.find(s => s.source === 'leaderboard')?.updatedAt,
      trades: ingestionStates.find(s => s.source === 'trades')?.updatedAt,
      markets: ingestionStates.find(s => s.source === 'markets')?.updatedAt,
    };

    const status = databaseHealthy && redisHealthy 
      ? 'healthy' 
      : databaseHealthy || redisHealthy 
        ? 'degraded' 
        : 'unhealthy';

    return {
      status,
      database: databaseHealthy,
      redis: redisHealthy,
      lastIngestion,
    };
  }
}

