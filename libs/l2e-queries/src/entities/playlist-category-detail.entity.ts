import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimeEntity } from './base-time.entity';
import { PlaylistCategory } from './playlist-category.entity';
import { Playlist } from './playlist.entity';

// TODO: playlistCategory / playlist unique로 묶어서 중복 안되도록 변경
@Entity('playlist_category_details')
export class PlaylistCategoryDetail extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlaylistCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlist_category_id' })
  playlistCategory: number | PlaylistCategory;

  @ManyToOne(() => Playlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlist_id' })
  playlist: number | Playlist;
}
