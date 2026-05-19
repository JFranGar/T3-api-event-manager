import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('delete_events')
export class DeleteEventEntity {
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

  // Inconsistencia intencional: no existe campo description en esta tabla
  // a diferencia de las otras tablas

  @Column({ type: 'text', nullable: true })
  payload: string;

  @Column({ nullable: true })
  createdAt: string;
}
