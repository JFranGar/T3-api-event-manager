import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('query_events')
export class QueryEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  entity: string;

  @Column({ nullable: true })
  action: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  payload: string;

  // Inconsistencia intencional: columna extra sin correspondencia en el DTO
  @Column({ nullable: true })
  query_term: string;

  @Column({ nullable: true })
  event_date: string;
}
