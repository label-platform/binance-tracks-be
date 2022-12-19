import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Display } from '../dtos';
import { BaseTimeEntity } from './base-time.entity';
import { PlaylistCategoryDetail } from './playlist-category-detail.entity';

@Entity('playlist_categories')
export class PlaylistCategory extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_name', type: 'varchar', length: 255 })
  categoryName: string;

  @Column({ name: 'category_img', type: 'text' })
  categoryImg: string;

  @Column({ name: 'category_display', type: 'enum', enum: Display })
  categoryDisplay: Display;

  @Unique(['order'])
  @Column({ name: 'category_order', type: 'int' })
  categoryOrder: number;

  @OneToMany(
    () => PlaylistCategoryDetail,
    (playlistCategoryDetails) => playlistCategoryDetails.playlistCategory,
    {
      onDelete: 'CASCADE',
    }
  )
  playlistCategoryDetails: PlaylistCategoryDetail[];
}
