import { Playlist, PlaylistDetail, Song } from '@libs/l2e-queries/entities';
import {
  PlaylistDetailRepository,
  PlaylistRepository,
  SongRepository,
} from '@libs/l2e-queries/repositories';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PlaylistManagerUtilService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: PlaylistRepository,
    @InjectRepository(PlaylistDetail)
    private readonly playlistDetailRepository: PlaylistDetailRepository,
    @InjectRepository(Song)
    private readonly songRepository: SongRepository,
    @Inject(Logger) private readonly logger: Logger
  ) {}
  // TODO: refatoring 필요 / 변경된 데이터가 제대로 조회되지 않음
  async retrievePlaylistData(playlistName: string, playlistImg: string) {
    try {
      const playlist = await this.playlistRepository.findOneBy({
        playlistImg,
        playlistName,
      });
      return playlist;
    } catch (error) {
      this.logger.error(
        'retrievePlaylistData',
        error,
        'PlaylistManagerService'
      );
    }
  }

  async retrievePlaylistDetailData(playlistId: number) {
    try {
      const queryBuilder = await this.playlistRepository
        .createQueryBuilder('playlist')
        .leftJoinAndSelect('playlist.playlistDetail', 'playlistDetails')
        .leftJoinAndSelect('playlistDetails.song', 'songs')
        .where('playlist.id = :playlistId', {
          playlistId,
        })
        .getOne();

      return queryBuilder;
    } catch (error) {
      this.logger.error(
        'retrievePlaylistDetailData',
        error,
        'PlaylistManagerService'
      );
    }
  }

  async calculateTotalPlayTime(songIds: number[]): Promise<number> {
    try {
      const result = await this.songRepository
        .createQueryBuilder('song')
        .where('song.id IN (:...songIds)', { songIds })
        .select('SUM(song.playTime)', 'totalPlayTime')
        .getRawOne();

      return +result.totalPlayTime;
    } catch (error) {
      this.logger.error('calculatePlayTime', error, 'PlaylistManagerService');
    }
  }
}
