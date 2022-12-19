import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../base-time.entity';
import { ArtistInfo } from './artist-info.entity';
import { Song } from './song.entity';

@Entity('song_artist')
export class SongArtist extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Song, (song) => song.id)
  @JoinColumn({ name: 'song_id' })
  @Column({ name: 'song_id', type: 'bigint' })
  song: number | Song;

  @ManyToOne(() => ArtistInfo, (artistInfo) => artistInfo.id)
  @JoinColumn({ name: 'artist_info_id' })
  @Column({ name: 'artist_info_id', type: 'bigint' })
  artistInfo: number | ArtistInfo;
}
