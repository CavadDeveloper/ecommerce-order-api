import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  uptadedAt!: Date;
}
