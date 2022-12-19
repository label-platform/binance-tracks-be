import {
    // BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { StatusListenHistory } from '../dtos';
import { BaseTimeEntity } from './base-time.entity';
@Entity('listen_histories')
export class ListenHistory extends BaseTimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'integer', width: 11 })
    userId: number;

    @Column({ name: 'song_id', type: 'integer', width: 11, nullable: true })
    songId: number;

    @Column({ name: 'start_time' })
    startTime: string;

    @Column({ name: 'end_time' })
    endTime: string;

    @Column({ name: 'duration' })
    duration: string;

    @Column({ name: 'headphone_id', type: 'integer', width: 11 })
    headphoneId: number;

    @Column({
        name: 'token_earned', type: 'decimal',
        precision: 5,
        scale: 2,
    })
    tokenEarned: string;

    @Column({ name: 'status', type: 'enum', enum: StatusListenHistory })
    status: string;
}
