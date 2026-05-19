import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('update_events')
export class UpdateEventEntity {
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

  // Inconsistencia intencional: timestamp guardado como texto local, no UTC
  @Column({ nullable: true })
  timestamp: string;
}
