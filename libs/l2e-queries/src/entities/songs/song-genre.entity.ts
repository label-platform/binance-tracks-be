import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../base-time.entity';
import { GenreInfo } from './genre-info.entity';
import { Song } from './song.entity';

@Entity('song_genre')
export class SongGenre extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Song, (song) => song.id)
  @JoinColumn({ name: 'song_id' })
  @Column({ name: 'song_id', type: 'bigint' })
  song: number | Song;

  @ManyToOne(() => GenreInfo, (genreInfo) => genreInfo.id)
  @JoinColumn({ name: 'genre_info_id' })
  @Column({ name: 'genre_info_id', type: 'bigint' })
  genreInfo: number | GenreInfo;
}
