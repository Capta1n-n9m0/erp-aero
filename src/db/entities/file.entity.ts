import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  extension: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @UpdateDateColumn()
  createdAt: Date;
}