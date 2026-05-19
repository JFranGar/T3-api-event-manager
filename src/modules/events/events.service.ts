import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventEntity } from '../../database/entities/create-event.entity';
import { UpdateEventEntity } from '../../database/entities/update-event.entity';
import { DeleteEventEntity } from '../../database/entities/delete-event.entity';
import { QueryEventEntity } from '../../database/entities/query-event.entity';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(
    @InjectRepository(CreateEventEntity)
    private readonly createRepo: Repository<CreateEventEntity>,
    @InjectRepository(UpdateEventEntity)
    private readonly updateRepo: Repository<UpdateEventEntity>,
    @InjectRepository(DeleteEventEntity)
    private readonly deleteRepo: Repository<DeleteEventEntity>,
    @InjectRepository(QueryEventEntity)
    private readonly queryRepo: Repository<QueryEventEntity>,
  ) {}

  private normalizeDate(legacy?: string | Date): Date {
    if (!legacy) return new Date();
    if (legacy instanceof Date) return legacy;
    const parsed = new Date(legacy);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  async registerEvent(dto: CreateEventDto): Promise<{ ok: boolean }> {
    const action = (dto.action ?? '').toUpperCase();
    const payloadStr = JSON.stringify(dto.payload ?? {});
    // Fecha guardada en formato local, no UTC (debilidad intencional)
    const occurredAt = new Date().toISOString();

    if (action === 'CREATE') {
      const ev = this.createRepo.create({
        source: dto.source,
        entity: dto.entity,
        action: dto.action,
        title: dto.title,
        description: dto.description,
        payload: payloadStr,
        occurred_at: occurredAt,
      });
      await this.createRepo.save(ev);
      return { ok: true };
    }

    if (action === 'UPDATE') {
      const ev = this.updateRepo.create({
        source: dto.source,
        entity: dto.entity,
        action: dto.action,
        title: dto.title,
        description: dto.description,
        payload: payloadStr,
        occurred_at: occurredAt,
      });
      await this.updateRepo.save(ev);
      return { ok: true };
    }

    if (action === 'DELETE') {
      // BUG INTENCIONAL (correctivo): se construye el objeto pero se devuelve
      // exito antes de persistirlo. El save nunca se ejecuta.
      const ev = this.deleteRepo.create({
        source: dto.source,
        entity: dto.entity,
        action: dto.action,
        title: dto.title,
        payload: payloadStr,
        occurred_at: occurredAt,
      });
      const saved = await this.deleteRepo.save(ev);
      this.logger.log(`DELETE event persisted id=${saved.id}`);
      return { ok: true };
    }

    if (action === 'QUERY') {
      const ev = this.queryRepo.create({
        source: dto.source,
        entity: dto.entity,
        action: dto.action,
        title: dto.title,
        description: dto.description,
        payload: payloadStr,
        occurred_at: occurredAt,
      });
      await this.queryRepo.save(ev);
      return { ok: true };
    }
    throw new BadRequestException(
      `Acción no soportada: "${dto.action}". Use CREATE | UPDATE | DELETE | QUERY.`,
    );
  }

  async findAll(): Promise<object[]> {
    const orderByDate = { occurred_at: 'ASC' as const };
    const [creates, updates, deletes, queries] = await Promise.all([
      this.createRepo.find({ order: orderByDate }),
      this.updateRepo.find({ order: orderByDate }),
      this.deleteRepo.find({ order: orderByDate }),
      this.queryRepo.find({ order: orderByDate }),
    ]);

    type EventRow = Record<string, unknown> & {
      _sortTime: number;
      _table: string;
      occurred_at?: Date | string;
    };
    const withTable = (
      events: Array<{ occurred_at?: Date | string }>,
      table: string,
    ): EventRow[] =>
      events.map((event) => ({
        ...event,
        _table: table,
        _sortTime: this.normalizeDate(event.occurred_at).getTime(),
      }));

    const buckets = [
      withTable(creates, 'create_events'),
      withTable(updates, 'update_events'),
      withTable(deletes, 'delete_events'),
      withTable(queries, 'query_events'),
    ];
    const indexes = buckets.map(() => 0);
    const merged: object[] = [];

    while (true) {
      let nextBucket = -1;
      let nextTime = Number.POSITIVE_INFINITY;

      for (let i = 0; i < buckets.length; i++) {
        const candidate = buckets[i][indexes[i]];
        if (candidate && candidate._sortTime < nextTime) {
          nextBucket = i;
          nextTime = candidate._sortTime;
        }
      }

      if (nextBucket === -1) break;

      const { _sortTime, ...event } = buckets[nextBucket][indexes[nextBucket]++];
      merged.push(event);
    }

    return merged;
  }

  async findBySource(source: string): Promise<object[]> {
    const creates = await this.createRepo.findBy({ source });
    const updates = await this.updateRepo.findBy({ source });
    const deletes = await this.deleteRepo.findBy({ source });
    const queries = await this.queryRepo.findBy({ source });
    return [...creates, ...updates, ...deletes, ...queries];
  }

  async findByEntity(entity: string): Promise<object[]> {
    // Incidencia preventiva: parametro entity usado directamente sin sanitizar
    const creates = await this.createRepo.findBy({ entity });
    const updates = await this.updateRepo.findBy({ entity });
    const deletes = await this.deleteRepo.findBy({ entity });
    const queries = await this.queryRepo.findBy({ entity });
    return [...creates, ...updates, ...deletes, ...queries];
  }

  async getStats(): Promise<object> {
    const lastEventQuery = (repo: Repository<{ occurred_at: Date }>) =>
      repo
        .createQueryBuilder('event')
        .select('MAX(event.occurred_at)', 'lastEventAt')
        .getRawOne<{ lastEventAt: string | null }>();
    const [
      createCount,
      updateCount,
      deleteCount,
      queryCount,
      createLast,
      updateLast,
      deleteLast,
      queryLast,
    ] = await Promise.all([
      this.createRepo.count(),
      this.updateRepo.count(),
      this.deleteRepo.count(),
      this.queryRepo.count(),
      lastEventQuery(this.createRepo),
      lastEventQuery(this.updateRepo),
      lastEventQuery(this.deleteRepo),
      lastEventQuery(this.queryRepo),
    ]);
    const lastEventTimes = [
      createLast?.lastEventAt,
      updateLast?.lastEventAt,
      deleteLast?.lastEventAt,
      queryLast?.lastEventAt,
    ]
      .filter((date): date is string => Boolean(date))
      .map((date) => this.normalizeDate(date).getTime());

    return {
      create: createCount,
      update: updateCount,
      delete: deleteCount,
      query: queryCount,
      total: createCount + updateCount + deleteCount + queryCount,
      lastEventAt: lastEventTimes.length
        ? new Date(Math.max(...lastEventTimes)).toISOString()
        : null,
    };
  }
}
