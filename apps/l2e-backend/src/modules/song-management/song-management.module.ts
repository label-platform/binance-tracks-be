import {
  AlbumInfo,
  ArtistInfo,
  GenreInfo,
  Item,
  Song,
  SongArtist,
  SongGenre,
  User,
} from '@libs/l2e-queries/entities';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SongManagementUtilService } from './song-management-util.service';
import { SongManagementController } from './song-management.controller';
import { SongManagementService } from './song-management.service';

const ImportedModels = TypeOrmModule.forFeature([
  Item,
  Song,
  User,
  AlbumInfo,
  ArtistInfo,
  GenreInfo,
  SongArtist,
  SongGenre,
]);

@Module({
  imports: [ImportedModels],
  controllers: [SongManagementController],
  providers: [SongManagementService, SongManagementUtilService, Logger],
})
export class SongManagementModule {}
