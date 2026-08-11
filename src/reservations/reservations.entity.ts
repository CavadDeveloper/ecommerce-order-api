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
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  status!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
  @Column()
  userId!: string;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
