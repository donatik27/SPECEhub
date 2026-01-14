import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { TradersModule } from './traders/traders.module';
import { MarketsModule } from './markets/markets.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    TradersModule,
    MarketsModule,
  ],
})
export class AppModule {}

