import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('idempotency_keys')
export class IdempotencyKeyEntity {
  @PrimaryColumn()
  key!: string;
  @CreateDateColumn()
  createdAt!: Date;
  @Column({ type: 'json' })
  response!: any;
}
