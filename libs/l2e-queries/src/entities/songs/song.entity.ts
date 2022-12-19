import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SongStatus } from '../../dtos/common';
import { BaseTimeEntity } from '../base-time.entity';
import { User } from '../user.entity';
import { AlbumInfo } from './album-info.entity';
import { SongArtist } from './song-artist.entity';
import { SongGenre } from './song-genre.entity';

@Entity('songs')
export class Song extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: number | User;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 's3_name', type: 'varchar', length: 255 })
  s3name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'status', type: 'enum', enum: SongStatus })
  status: SongStatus;

  @ManyToOne(() => AlbumInfo, (albumInfo) => albumInfo.id)
  @JoinColumn({ name: 'album_id' })
  @Column({ name: 'album_id', type: 'bigint', nullable: true })
  album: number | AlbumInfo;

  // @ManyToOne(() => ArtistInfo, (artistInfo) => artistInfo.id)
  // @Column({ name: 'artist_id', type: 'int' })
  // artist: number | ArtistInfo;

  @Column({ name: 'play_time', type: 'int' })
  playTime: number;

  @OneToMany(() => SongArtist, (songArtist) => songArtist.song)
  artists: SongArtist[];

  @OneToMany(() => SongGenre, (songGenre) => songGenre.song)
  genres: SongGenre[];
}
