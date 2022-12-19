import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from './base-time.entity';
import { User } from './user.entity';

@Entity('activation_codes')
export class ActivationCode extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'code',
    type: 'varchar',
    length: 8,
    nullable: false,
    unique: true,
  })
  code: string;

  @ManyToOne(() => User, (user) => user.activationCodes)
  @JoinColumn({ name: 'owner_id' })
  owner: number | User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'register_id' })
  register?: number | User;
}
