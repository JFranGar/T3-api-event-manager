import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CreateEventEntity } from '../../database/entities/create-event.entity';
import { UpdateEventEntity } from '../../database/entities/update-event.entity';
import { DeleteEventEntity } from '../../database/entities/delete-event.entity';
import { QueryEventEntity } from '../../database/entities/query-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreateEventEntity,
      UpdateEventEntity,
      DeleteEventEntity,
      QueryEventEntity,
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
