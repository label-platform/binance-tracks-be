import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('crawler_logs')
export class CrawlerLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'no', type: 'numeric', nullable: false })
  no: number;

  @Column({ name: 'from_block', type: 'bigint', nullable: false })
  fromBlock: number;

  @Column({ name: 'to_block', type: 'bigint', nullable: false })
  toBlock: number;

  @Column({
    name: 'contract_address',
    type: 'varchar',
    length: 42,
    nullable: false,
  })
  contractAddress: string;
}
