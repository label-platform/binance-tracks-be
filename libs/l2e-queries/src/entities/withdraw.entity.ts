import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WithdrawStatus, WithdrawType } from '../dtos';
import { BaseTimeEntity } from './base-time.entity';

@Entity('withdraws')
export class Withdraw extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type', type: 'enum', enum: WithdrawType })
  type: string;

  @Column({
    name: 'collection_address',
    type: 'varchar',
    length: 42,
    nullable: true,
  })
  collectionAddress: string;

  @Column({ name: 'token_id', type: 'bigint', nullable: true })
  tokenId: number;

  @Column({ name: 'nft_id', type: 'bigint', nullable: true })
  nftId: number;

  @Column({
    name: 'token_address',
    type: 'varchar',
    length: 42,
    nullable: true,
  })
  tokenAddress: string;

  @Column({ name: 'amount', type: 'varchar', length: 255, nullable: true })
  amount: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'main_wallet', type: 'varchar', length: 42 })
  mainWallet: string;

  @Column({ name: 'status', type: 'enum', enum: WithdrawStatus })
  status: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash: string;

  // TODO: 임시로 추가. history 모듈 및 관련 테이블 생성 후 삭제
  @Column({ name: 'category', type: 'varchar' })
  category: string;

  // @CreateDateColumn({ name: 'created_at' })
  // createdAt: Date;

  // @UpdateDateColumn({ name: 'updated_at' })
  // updatedAt: Date;
}
