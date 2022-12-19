import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../base-time.entity';
import { AlbumInfo } from './album-info.entity';
import { ArtistInfo } from './artist-info.entity';

@Entity('album_artist')
export class AlbumArtist extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AlbumInfo, (album) => album.id)
  @JoinColumn({ name: 'album_id' })
  @Column({ name: 'album_id', type: 'bigint' })
  album: number | AlbumInfo;

  @ManyToOne(() => ArtistInfo, (artistInfo) => artistInfo.id)
  @JoinColumn({ name: 'artist_info_id' })
  @Column({ name: 'artist_info_id', type: 'bigint' })
  artistInfo: number | ArtistInfo;
}
