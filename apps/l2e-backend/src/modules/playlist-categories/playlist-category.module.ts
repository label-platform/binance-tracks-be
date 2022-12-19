import { Logger, Module } from '@nestjs/common';
import { PlaylistCategoryService } from './playlist-category.service';
import { PlaylistCategoryController } from './playlist-category.controller';
import {
  Playlist,
  PlaylistCategory,
  PlaylistCategoryDetail,
  PlaylistDetail,
} from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistCategoryUtilService } from './playlist-category-util.service';

const Model = TypeOrmModule.forFeature([
  Playlist,
  PlaylistDetail,
  PlaylistCategory,
  PlaylistCategoryDetail,
]);

@Module({
  imports: [Model],
  providers: [PlaylistCategoryService, PlaylistCategoryUtilService, Logger],
  controllers: [PlaylistCategoryController],
})
export class PlaylistCategoryModule {}
