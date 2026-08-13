import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  status!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
  @Column()
  userId!: number;
  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
