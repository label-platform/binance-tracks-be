import { Logger, Module } from '@nestjs/common';
import { PlaylistManagerService } from './playlist-manager.service';
import { PlaylistManagerController } from './playlist-manager.controller';
import { Playlist, PlaylistDetail, Song } from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistManagerUtilService } from './playlist-manager-util.service';

const Model = TypeOrmModule.forFeature([Playlist, PlaylistDetail, Song]);

@Module({
  imports: [Model],
  providers: [PlaylistManagerService, PlaylistManagerUtilService, Logger],
  controllers: [PlaylistManagerController],
})
export class PlaylistManagerModule {}
