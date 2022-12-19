import { LocalDateTime } from '@js-joda/core';
import { BaseEntity, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { MysteryBoxQuality } from '../dtos/common';
import { LocalDateTimeTransformer } from '../transformers/local-date-time-transformer';
import { Item } from './item.entity';

@Entity('mystery_boxes')
export class MysteryBox extends BaseEntity {
  @Column({ name: 'item_id', primary: true, type: 'bigint', nullable: false })
  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: number | Item;

  @Column({ name: 'quality', type: 'enum', enum: MysteryBoxQuality })
  quality!: MysteryBoxQuality;

  @Column({
    name: 'openingtime_countdown',
    type: 'datetime',
    transformer: new LocalDateTimeTransformer(),
    nullable: true,
  })
  openingTimeCountdown: LocalDateTime;
}
