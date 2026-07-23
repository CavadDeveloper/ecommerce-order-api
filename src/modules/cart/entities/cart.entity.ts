import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { CartItem } from './cart-item.entity';
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;
  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items!: CartItem[];
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}
