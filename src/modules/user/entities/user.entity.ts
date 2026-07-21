import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Address } from '../../address/entities/address.entity';
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;
  @Column({ type: 'varchar', length: 255 })
  password!: string;
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string;
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string;
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;
  @OneToMany(() => Address, (address) => address.user)
  addresses!: Address[];
  @Column({ nullable: true })
  currentHashedRefreshToken?: string;
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
