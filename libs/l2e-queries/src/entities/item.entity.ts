import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemStatus, ItemType } from '../dtos/common';
import { BaseTimeEntity } from './base-time.entity';
import { ItemSale } from './item-sale.entity';
import { Nft } from './nft.entity';
import { Sticker } from './sticker.entity';
import { User } from './user.entity';

@Entity('items')
export class Item extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: number | User;

  @Column({ name: 'img_url', type: 'text' })
  imgUrl: string;

  @OneToOne(() => Nft)
  @JoinColumn({ name: 'nft_id' })
  nft: number | Nft;

  @Column({ name: 'type', type: 'enum', enum: ItemType })
  type: ItemType;

  @Column({
    name: 'item_status',
    type: 'enum',
    enum: ItemStatus,
    nullable: true,
  })
  itemStatus: ItemStatus;

  @OneToOne(() => ItemSale, (itemSale) => itemSale.item)
  itemSale: ItemSale;
  @OneToOne(() => Sticker, (sticker) => sticker.item)
  stickerDetail: Sticker;
}
