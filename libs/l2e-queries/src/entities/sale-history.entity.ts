import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ItemType, TradeType } from '../dtos/common/enums';
import { ColumnDecimalTransformer } from '../transformers/column-decimal-transformer';
import { BaseTimeEntity } from './base-time.entity';

@Entity('sale_histories')
export class SaleHistory extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'type', type: 'enum', enum: ItemType })
  type: ItemType;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  userEmail: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string;

  @Column({ name: 'user_walletAddress', type: 'varchar', length: 42 })
  userWalletAddress: string;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 20,
    scale: 3,
    transformer: new ColumnDecimalTransformer(),
  })
  price: number;

  @Column({
    name: 'trade_type',
    type: 'enum',
    enum: TradeType,
  })
  tradeType: TradeType;
}
