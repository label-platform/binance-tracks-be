import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MainNetNetwork, TokenSymbol } from '../dtos';
import { ColumnDecimalTransformer } from '../transformers/column-decimal-transformer';
import { BaseTimeEntity } from './base-time.entity';
import { User } from './user.entity';

@Entity('spending_balances')
export class SpendingBalance extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_id', type: 'bigint', nullable: false })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: number;

  @Column({ name: 'network', type: 'enum', enum: MainNetNetwork })
  network: MainNetNetwork;

  @Column({
    name: 'token_symbol',
    type: 'enum',
    enum: TokenSymbol,
    nullable: false,
  })
  tokenSymbol: TokenSymbol;

  @Column({
    name: 'token_decimal',
    type: 'integer',
    width: 2,
    nullable: false,
  })
  tokenDecimals: number;

  @Column({
    name: 'token_address',
    type: 'varchar',
    length: 42,
    nullable: false,
  })
  tokenAddress: string;

  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 15,
    scale: 3,
    nullable: false,
    transformer: new ColumnDecimalTransformer(),
  })
  balance: number;

  @Column({
    name: 'available_balance',
    type: 'decimal',
    precision: 15,
    scale: 3,
    nullable: false,
    transformer: new ColumnDecimalTransformer(),
  })
  availableBalance: number;

  // @CreateDateColumn({ name: 'created_at' })
  // createdAt: Date;

  // @UpdateDateColumn({ name: 'updated_at' })
  // updatedAt: Date;
}
