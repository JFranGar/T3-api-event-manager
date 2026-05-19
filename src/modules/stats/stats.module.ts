import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [StatsController],
})
export class StatsModule {}
