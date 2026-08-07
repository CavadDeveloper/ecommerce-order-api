import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
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
  @Column()
  size!: number;
  @Column()
  path!: string;
  @CreateDateColumn()
  createdDate!: Date;
}
