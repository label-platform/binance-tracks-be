import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ColumnDecimalTransformer } from '../transformers/column-decimal-transformer';
import { BaseTimeEntity } from './base-time.entity';
import { Item } from './item.entity';

@Entity('item_sales')
export class ItemSale extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: number | Item;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 20,
    scale: 3,
    transformer: new ColumnDecimalTransformer(),
  })
  price: number;

  @Column({ name: 'currency', type: 'varchar', default: 'BNB' })
  currency: string;
}
