import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Display } from '../dtos';
import { BaseTimeEntity } from './base-time.entity';
import { PlaylistDetail } from './playlist-detail.entity';

@Entity('playlists')
export class Playlist extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'playlist_name', type: 'varchar', length: 255 })
  playlistName: string;

  @Column({ name: 'playlist_img', type: 'text' })
  playlistImg: string;

  @Column({ name: 'playlist_display', type: 'enum', enum: Display })
  playlistDisplay: Display;

  @Column({ name: 'total_songs_count', type: 'int', default: 0 })
  totalSongsCount: number;

  @Column({ name: 'total_play_time', type: 'int', default: 0 })
  totalPlayTime: number;

  @Unique(['order'])
  @Column({ name: 'playlist_order', type: 'int' })
  playlistOrder: number;

  @OneToMany(
    () => PlaylistDetail,
    (playlistDetail) => playlistDetail.playlist,
    {
      onDelete: 'CASCADE',
    }
  )
  playlistDetail: PlaylistDetail[];
}
