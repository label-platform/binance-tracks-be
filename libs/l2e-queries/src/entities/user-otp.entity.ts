import { LocalDateTime } from '@js-joda/core';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LocalDateTimeTransformer } from '../transformers/local-date-time-transformer';
import { BaseTimeEntity } from './base-time.entity';
import { User } from './user.entity';

@Entity('user_otps')
export class UserOtp extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unique: true, nullable: true })
  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({
    name: 'otp',
    type: 'varchar',
    length: 6,
  })
  otp: string;

  @Column({
    name: 'expired_at',
    type: 'datetime',
    transformer: new LocalDateTimeTransformer(),
  })
  expiredAt: LocalDateTime;

  @Column({
    name: '2fa_secret',
    type: 'varchar',
    nullable: true,
  })
  twoFactorAuthenticationSecret: string;
}
