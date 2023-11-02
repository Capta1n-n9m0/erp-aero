import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({
    type: 'varchar',
    length: 100,
  })
  id: string;

  @Column()
  password: string;
}
