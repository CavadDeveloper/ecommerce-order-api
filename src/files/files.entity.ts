import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FilePurpose } from './file-purpose.enum';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  filename!: string;

  @Column()
  originalname!: string;

  @Column()
  mimetype!: string;

  @Column({
    type: 'enum',
    enum: FilePurpose,
  })
  purpose!: FilePurpose;

  @Column()
  size!: number;

  @Column()
  path!: string;

  @Column({ nullable: true })
  userId!: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdDate!: Date;
}
