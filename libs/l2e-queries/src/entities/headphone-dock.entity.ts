import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Attribute, DockStatus, Quality } from '../dtos/common';
import { Item } from './item.entity';

@Entity('headphone_docks')
export class HeadphoneDock extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Exclude()
  id: number;

  @Column({ name: 'headphone_id', type: 'bigint', nullable: false })
  @ManyToOne(() => Item)
  @JoinColumn({ name: 'headphone_id' })
  headphone: number | Item;

  @Column({ name: 'sticker_id', type: 'bigint', nullable: true })
  @OneToOne(() => Item)
  @JoinColumn({ name: 'sticker_id' })
  sticker: number | Item;

  @Column({ name: 'position', type: 'tinyint', nullable: false })
  position: number;

  @Column({
    name: 'dock_status',
    type: 'enum',
    enum: DockStatus,
    default: DockStatus.NOT_OPENED,
  })
  dockStatus: DockStatus;

  @Column({
    name: 'quality',
    type: 'enum',
    enum: Quality,
    default: Quality.UNKNOWN,
  })
  quality!: Quality;

  @Column({ name: 'attribute', type: 'enum', enum: Attribute })
  attribute!: Attribute;
}
