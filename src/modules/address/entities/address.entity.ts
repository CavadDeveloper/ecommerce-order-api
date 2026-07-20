import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 255 })
  title!: string;
  @Column({ type: 'varchar', length: 255 })
  addressLine!: string;
  @Column({ type: 'varchar', length: 100 })
  city!: string;
  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string;
  @Column({ name: 'user_id' })
  userId!: number;
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
