import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from 'src/modules/product/entities/product.entity';
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart!: Cart;
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product!: Product;
  @Column({ type: 'int', default: 1 })
  quantity!: number;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
