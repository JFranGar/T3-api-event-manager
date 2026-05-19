import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
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
  private readonly maxPayloadBytes = 8 * 1024;
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

  private normalizeDate(legacy?: string): Date {
    if (!legacy) return new Date();
    const parsed = new Date(legacy);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  async registerEvent(dto: CreateEventDto): Promise<{ ok: boolean; id: number }> {
    const action = (dto.action ?? '').toUpperCase();
    const payloadStr = JSON.stringify(dto.payload ?? {});
    if (Buffer.byteLength(payloadStr, 'utf8') > this.maxPayloadBytes) {
      throw new PayloadTooLargeException('payload supera 8KB');
    }

    // Fecha guardada en formato local, no UTC (debilidad intencional)
    const occurredAt = new Date().toISOString();

    try {
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
        const saved = await this.createRepo.save(ev);
        return { ok: true, id: saved.id };
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
        const saved = await this.updateRepo.save(ev);
        return { ok: true, id: saved.id };
      }

      if (action === 'DELETE') {
        const ev = this.deleteRepo.create({
          source: dto.source,
          entity: dto.entity,
          action: dto.action,
          title: dto.title,
          payload: payloadStr,
          occurred_at: occurredAt,
        });
        const saved = await this.deleteRepo.save(ev);
        return { ok: true, id: saved.id };
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
        const saved = await this.queryRepo.save(ev);
        return { ok: true, id: saved.id };
      }

      throw new BadRequestException(
        `Acción no soportada: "${dto.action}". Use CREATE | UPDATE | DELETE | QUERY.`,
      );
    } catch (err) {
      this.logger.error(`Fallo al persistir ${dto.action}`, err as Error);
      throw new InternalServerErrorException('No se pudo registrar el evento');
    }
  }

  async findAll(): Promise<object[]> {
    // Incidencia perfectiva: agrega 4 tablas en memoria sin orden garantizado
    const creates = await this.createRepo.find();
    const updates = await this.updateRepo.find();
    const deletes = await this.deleteRepo.find();
    const queries = await this.queryRepo.find();

    // Ordena lexicograficamente por strings de fecha heterogeneos (incorrecto)
    const merged = [
      ...creates.map((e) => ({ ...e, _table: 'create_events' })),
      ...updates.map((e) => ({ ...e, _table: 'update_events' })),
      ...deletes.map((e) => ({ ...e, _table: 'delete_events' })),
      ...queries.map((e) => ({ ...e, _table: 'query_events' })),
    ];

    merged.sort((a, b) => {
      const dateA = this.normalizeDate((a as any).occurred_at);
      const dateB = this.normalizeDate((b as any).occurred_at);
      return dateA.getTime() - dateB.getTime();
    });

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
    const normalizedEntity = this.normalizeEntity(entity);
    const creates = await this.createRepo.findBy({ entity: normalizedEntity });
    const updates = await this.updateRepo.findBy({ entity: normalizedEntity });
    const deletes = await this.deleteRepo.findBy({ entity: normalizedEntity });
    const queries = await this.queryRepo.findBy({ entity: normalizedEntity });
    return [...creates, ...updates, ...deletes, ...queries];
  }

  private normalizeEntity(entity: string): string {
    const normalizedEntity = entity.trim();
    if (!normalizedEntity) {
      throw new BadRequestException('entity es obligatorio');
    }

    if (normalizedEntity.length > 60) {
      throw new BadRequestException('entity supera 60 caracteres');
    }

    if (/[\u0000-\u001f\u007f]/.test(normalizedEntity)) {
      throw new BadRequestException('entity contiene caracteres no válidos');
    }

    return normalizedEntity;
  }

  async getStats(): Promise<object> {
    const createCount = await this.createRepo.count();
    const updateCount = await this.updateRepo.count();
    const deleteCount = await this.deleteRepo.count();
    // Incidencia perfectiva: query_events no se incluye en el total
    return {
      create: createCount,
      update: updateCount,
      delete: deleteCount,
      total: createCount + updateCount + deleteCount,
    };
  }
}
