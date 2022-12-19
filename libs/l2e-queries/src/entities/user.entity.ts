import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ColumnDecimalTransformer } from '../transformers/column-decimal-transformer';
import { ActivationCode } from './activation-code.entity';
import { BaseTimeEntity } from './base-time.entity';

@Entity('users')
export class User extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'username', type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ name: 'role', type: 'varchar', length: 255, default: 'listener' })
  role: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password', type: 'text', nullable: true, select: false })
  password: string;

  @Column({
    name: 'activation_code_id',
    type: 'integer',
    width: 11,
    nullable: true,
  })
  activationCodeId: number;

  @Column({
    name: 'wallet_address',
    type: 'varchar',
    width: 42,
    nullable: true,
  })
  walletAddress: string;

  @Column({
    name: 'energy_cap',
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  energyCap: number;

  @Column({
    name: 'available_energy',
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  availableEnergy: number;

  @Column({
    name: 'count_energy',
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  countEnergy: number;

  @Column({
    name: 'daily_token_earning_limit',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  dailyTokenEarningLimit: number;

  @Column({
    name: 'remained_token_earning_limit',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  remainedTokenEarningLimit: number;

  @Column({ name: '2fa_registered', default: false })
  isTwoFactorAuthenticationRegistered: boolean;

  @Column({ name: '2fa_enabled', default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @OneToMany(() => ActivationCode, (activationCode) => activationCode.owner)
  activationCodes: ActivationCode[];
}
