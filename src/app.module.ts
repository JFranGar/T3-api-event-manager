import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [DatabaseModule, EventsModule, HealthModule, StatsModule],
})
export class AppModule {}
