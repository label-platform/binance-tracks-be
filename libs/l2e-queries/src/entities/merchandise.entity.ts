import { BaseEntity, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Item } from './item.entity';

@Entity('merchandise')
export class Merchandise extends BaseEntity {
  @Column({ name: 'item_id', primary: true, type: 'bigint', nullable: false })
  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: number | Item;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;
}
