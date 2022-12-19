import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimeEntity } from './base-time.entity';

@Entity('login_sessions')
export class LoginSession extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer', width: 11, unique: true })
  userId: number;

  @Column({
    name: 'access_token',
    type: 'text',
    nullable: true,
  })
  accessToken: string;

  @Column({
    name: 'refresh_token',
    type: 'text',
    nullable: true,
  })
  refreshToken: string;

  @Column({
    name: 'device',
    type: 'text',
    nullable: true,
  })
  device: string;

  @Column({
    name: 'ip',
    type: 'varchar',
    length: 255,
  })
  ip: string;

  // @CreateDateColumn({ name: 'created_at' })
  // createdAt: Date;

  // @UpdateDateColumn({ name: 'updated_at' })
  // updatedAt: Date;
}
