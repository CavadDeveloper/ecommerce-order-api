import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from 'src/modules/category/entities/category.entity';
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 255 })
  name!: string;
  @Column({ type: 'text', nullable: true })
  description!: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;
  @Column({ type: 'int', default: 0 })
  stock!: number;
  @Column({ name: 'category_id', nullable: true })
  categoryId!: number | null;
  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: number | null;
}
