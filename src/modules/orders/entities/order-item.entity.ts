import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order!: Order;
  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  product!: Product;
  @Column()
  productName!: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;
  @Column({ type: 'int' })
  quantity!: number;
  @CreateDateColumn()
  createdAt!: Date;
}
