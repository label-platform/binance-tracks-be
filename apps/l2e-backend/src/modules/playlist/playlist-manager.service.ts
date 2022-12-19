import { Order } from '@libs/l2e-pagination/constants';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import {
  CreatePlaylistDto,
  Display,
  SongDto,
  SongStatus,
  UpdatePlaylistDto,
} from '@libs/l2e-queries/dtos';
import { Playlist, PlaylistDetail } from '@libs/l2e-queries/entities';
import {
  PlaylistDetailRepository,
  PlaylistRepository,
} from '@libs/l2e-queries/repositories';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { DataSource } from 'typeorm';
import { PlaylistManagerUtilService } from './playlist-manager-util.service';

@Injectable()
export class PlaylistManagerService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: PlaylistRepository,
    @InjectRepository(PlaylistDetail)
    private readonly playlistDetailRepository: PlaylistDetailRepository,
    @Inject(PlaylistManagerUtilService)
    private readonly playlistManagerUtilService: PlaylistManagerUtilService,
    private readonly dataSource: DataSource
  ) {}

  async createPlaylist(createPlaylistDto: CreatePlaylistDto) {
    try {
      const { playlistName, playlistImg, playlistOrder } = createPlaylistDto;
      await this.dataSource.transaction(async (manager) => {
        const newPlaylist = this.playlistRepository.create({
          playlistDisplay: Display.SHOW,
          playlistName,
          playlistImg,
          playlistOrder,
        });
        await manager.save(newPlaylist);
      });
      return await this.playlistManagerUtilService.retrievePlaylistData(
        playlistName,
        playlistImg
      );
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchPlaylist(pageOptionsDto: PageOptionsDto) {
    try {
      const queryBuilder = this.playlistRepository
        .createQueryBuilder('playlist')
        .leftJoinAndSelect('playlist.playlistDetail', 'playlistDetails')
        .leftJoinAndSelect('playlistDetails.song', 'songs')
        .leftJoinAndSelect('songs.artists', 'artists')
        .leftJoinAndSelect('artists.artistInfo', 'artistInfo')
        .where('playlist.playlistDisplay = :playlistDisplay', {
          playlistDisplay: Display.SHOW,
        })
        .andWhere('songs.status = :status', {
          status: SongStatus.UPLOAD,
        });

      queryBuilder
        .orderBy('playlist.playlistOrder', Order.ASC)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchPlaylistById(pageOptionsDto: PageOptionsDto, playlistId: number) {
    try {
      const queryBuilder = this.playlistRepository
        .createQueryBuilder('playlist')
        .leftJoinAndSelect('playlist.playlistDetail', 'playlistDetails')
        .leftJoinAndSelect('playlistDetails.song', 'songs')
        .leftJoinAndSelect('songs.artists', 'artists')
        .leftJoinAndSelect('artists.artistInfo', 'artistInfo')
        .where('playlist.id = :playlistId', {
          playlistId,
        })
        .andWhere('playlist.playlistDisplay = :playlistDisplay', {
          playlistDisplay: Display.SHOW,
        })
        .andWhere('songs.status = :status', {
          status: SongStatus.UPLOAD,
        });

      queryBuilder
        .orderBy('playlist.playlistOrder', Order.ASC)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async addSongs(addSongDto: SongDto) {
    try {
      const { playlistId, songIds } = addSongDto;

      const playlist = await this.playlistRepository.findOneBy({
        id: playlistId,
      });
      if (!playlist) throw new NotFoundException('playlist does not exist');

      const addedTotalPlayTime =
        await this.playlistManagerUtilService.calculateTotalPlayTime(songIds);

      await this.dataSource.transaction(async (manager) => {
        for (const songId of songIds) {
          // TODO: bulk insert
          const newPlaylistDetail = this.playlistDetailRepository.create({
            playlist,
            song: songId,
          });
          await manager.save(newPlaylistDetail);
        }
        await manager.increment(
          Playlist,
          { id: playlistId },
          'totalSongsCount',
          songIds.length
        );

        await manager.increment(
          Playlist,
          { id: playlistId },
          'totalPlayTime',
          addedTotalPlayTime
        );
      });
      const result =
        await this.playlistManagerUtilService.retrievePlaylistDetailData(
          playlistId
        );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async subtractSongs(subtractSongDto: SongDto) {
    try {
      const { playlistId, songIds } = subtractSongDto;
      const playlist = await this.playlistRepository.findOneBy({
        id: playlistId,
      });

      if (!playlist) throw new NotFoundException('playlist does not exist');

      const deductedTotalPlayTime =
        await this.playlistManagerUtilService.calculateTotalPlayTime(songIds);

      await this.dataSource.transaction(async (manager) => {
        for (const songId of songIds) {
          // TODO: bulk delete
          await manager.delete(PlaylistDetail, {
            playlist,
            song: songId,
          });
        }
        await manager.decrement(
          Playlist,
          { id: playlistId },
          'totalSongsCount',
          songIds.length
        );

        await manager.decrement(
          Playlist,
          { id: playlistId },
          'totalPlayTime',
          deductedTotalPlayTime
        );
      });
      const result =
        await this.playlistManagerUtilService.retrievePlaylistDetailData(
          playlistId
        );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
    return;
  }

  async updatePlaylist(
    updatePlaylistDto: UpdatePlaylistDto,
    playlistId: number
  ) {
    try {
      const { playlistName, playlistImg, playlistOrder, playlistDisplay } =
        updatePlaylistDto;
      const playlist = await this.playlistRepository.findOneBy({
        id: playlistId,
      });
      if (!playlist) throw new NotFoundException('playlist does not exist');

      await this.dataSource.transaction(async (manager) => {
        await manager.update(Playlist, playlistId, {
          playlistName,
          playlistImg,
          playlistOrder,
          playlistDisplay,
        });
      });
      const result =
        await this.playlistManagerUtilService.retrievePlaylistDetailData(
          playlistId
        );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async deletePlaylist(playlistId: number) {
    try {
      const playlist = await this.playlistRepository.findOneBy({
        id: playlistId,
      });
      if (!playlist) throw new NotFoundException('playlist does not exist');

      await this.dataSource.transaction(async (manager) => {
        await manager.delete(Playlist, playlistId);
      });
    } catch (error) {
      exceptionHandler(error);
    }
  }
}
