import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Quality } from '../dtos/common';
import { Item } from './item.entity';

@Entity('headphone_boxes')
export class HeadphoneBox extends BaseEntity {
  @Column({ name: 'item_id', primary: true, type: 'bigint', nullable: false })
  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: number | Item;

  @Column({ name: 'parent_id_1', type: 'bigint', nullable: true })
  @ManyToOne(() => Item)
  @JoinColumn({ name: 'parent_id_1' })
  parentId1: number | Item;

  @Column({ name: 'parent_id_2', type: 'bigint', nullable: true })
  @ManyToOne(() => Item)
  @JoinColumn({ name: 'parent_id_2' })
  parentId2: number | Item;

  @Column({ name: 'quality', type: 'enum', enum: Quality })
  quality!: Quality;

  // @Column({
  //   name: 'opening_time',
  //   type: 'datetime',
  //   transformer: new LocalDateTimeTransformer(),
  //   nullable: true,
  // })
  // openingTime: LocalDateTime;
}
