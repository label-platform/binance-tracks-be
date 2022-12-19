import { LocalDateTime } from '@js-joda/core';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Quality } from '../dtos/common';
import { ColumnDecimalTransformer } from '../transformers/column-decimal-transformer';
import { LocalDateTimeTransformer } from '../transformers/local-date-time-transformer';
import { Item } from './item.entity';

@Entity('headphones')
export class Headphone extends BaseEntity {
  @Column({ primary: true, name: 'item_id', type: 'bigint', nullable: false })
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

  @Column({
    name: 'base_luck',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  baseLuck: number;

  @Column({
    name: 'level_luck',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  levelLuck: number;

  @Column({
    name: 'item_luck',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  itemLuck: number;

  @Column({
    name: 'luck',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  luck: number;

  @Column({
    name: 'base_efficiency',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  baseEfficiency: number;

  @Column({
    name: 'level_efficiency',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  levelEfficiency: number;

  @Column({
    name: 'item_efficiency',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  itemEfficiency: number;

  @Column({
    name: 'efficiency',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  efficiency: number;

  @Column({
    name: 'base_comfort',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  baseComfort: number;

  @Column({
    name: 'level_comfort',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  levelComfort: number;

  @Column({
    name: 'item_comfort',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  itemComfort: number;

  @Column({
    name: 'comfort',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  comfort: number;

  @Column({
    name: 'base_resilience',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  baseResilience: number;

  @Column({
    name: 'level_resilience',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  levelResilience: number;

  @Column({
    name: 'item_resilience',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
    default: 0,
  })
  itemResilience: number;

  @Column({
    name: 'resilience',
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: new ColumnDecimalTransformer(),
  })
  resilience: number;

  @Column({ name: 'battery', type: 'int', default: 100 })
  battery: number;

  @Column({ name: 'level', type: 'int', default: 0 })
  level: number;

  @Column({ name: 'quality', type: 'enum', enum: Quality })
  quality!: Quality;

  @Column({ name: 'mint_count', type: 'int', default: 0 })
  mintCount: number;

  @Column({ name: 'available_mint_count', type: 'int', default: 0 })
  availableMintCount: number;

  @Column({ name: 'remained_stat', type: 'int', default: 0 })
  remainedStat: number;

  @Column({
    name: 'leveling_time',
    type: 'datetime',
    transformer: new LocalDateTimeTransformer(),
    nullable: true,
  })
  levelUpCompletionTime: LocalDateTime;

  @Column({
    name: 'cooldown_time',
    type: 'datetime',
    transformer: new LocalDateTimeTransformer(),
    nullable: true,
  })
  cooldownTime: LocalDateTime;
}
