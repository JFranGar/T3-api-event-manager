import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateEventEntity } from './entities/create-event.entity';
import { UpdateEventEntity } from './entities/update-event.entity';
import { DeleteEventEntity } from './entities/delete-event.entity';
import { QueryEventEntity } from './entities/query-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'db/events.sqlite',
      entities: [
        CreateEventEntity,
        UpdateEventEntity,
        DeleteEventEntity,
        QueryEventEntity,
      ],
      synchronize: true,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
