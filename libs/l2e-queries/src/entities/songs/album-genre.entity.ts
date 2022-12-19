import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../base-time.entity';
import { AlbumInfo } from './album-info.entity';
import { GenreInfo } from './genre-info.entity';

@Entity('album_genre')
export class AlbumGenre extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AlbumInfo, (album) => album.id)
  @JoinColumn({ name: 'album_id' })
  @Column({ name: 'album_id', type: 'bigint' })
  album: number | AlbumInfo;

  @ManyToOne(() => GenreInfo, (genreInfo) => genreInfo.id)
  @JoinColumn({ name: 'genre_info_id' })
  @Column({ name: 'genre_info_id', type: 'bigint' })
  genreInfo: number | GenreInfo;
}
