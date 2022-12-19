import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';
import { MainNetNetwork } from '../dtos';
import { BaseTimeEntity } from './base-time.entity';

@Entity('nfts')
export class Nft extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  @Exclude()
  id: number;

  @Column({
    name: 'collection_address',
    type: 'varchar',
    length: 42,
    nullable: false,
  })
  collectionAddress: string;

  @Column({ name: 'token_id', type: 'bigint', nullable: true })
  tokenId: number;

  @Column({ name: 'network', type: 'enum', enum: MainNetNetwork })
  network: MainNetNetwork;

  @Column({ name: 'is_lock', type: 'tinyint', default: 1 })
  isLock: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner?: User | number;

  // @CreateDateColumn({ name: 'created_at' })
  // createdAt: Date;

  // @UpdateDateColumn({ name: 'updated_at' })
  // updatedAt: Date;
}
