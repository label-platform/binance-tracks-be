import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToOne,
  } from 'typeorm';
import { Attribute } from '../dtos/common';
import { Item } from './item.entity';
  
  @Entity('stickers')
  export class Sticker extends BaseEntity {
    @Column({ name: 'item_id', primary: true, nullable: false })
    @OneToOne(() => Item)
    @JoinColumn({ name: 'item_id' })
    item: number | Item;

    @Column({ name: 'attribute', type: 'enum', enum: Attribute })
    attribute!: Attribute;

    @Column({ name: 'level', type: 'int' })
    level: number;
  }
  