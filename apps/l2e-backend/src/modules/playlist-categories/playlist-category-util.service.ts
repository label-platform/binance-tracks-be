import {
  PlaylistCategory,
  PlaylistCategoryDetail,
} from '@libs/l2e-queries/entities';
import {
  PlaylistCategoryDetailRepository,
  PlaylistCategoryRepository,
} from '@libs/l2e-queries/repositories';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PlaylistCategoryUtilService {
  constructor(
    @InjectRepository(PlaylistCategory)
    private readonly playlistCategoryRepository: PlaylistCategoryRepository,
    @InjectRepository(PlaylistCategoryDetail)
    private readonly playlistCategoryDetailRepository: PlaylistCategoryDetailRepository,
    @Inject(Logger) private readonly logger: Logger
  ) {}
  // TODO: 변경된 데이터가 제대로 조회되지 않음
  async retrievePlaylistCategoryData(id: number) {
    try {
      const playlistCategory = await this.playlistCategoryRepository.findOneBy({
        id,
      });
      return playlistCategory;
    } catch (error) {
      this.logger.error(
        'retrievePlaylistCategoryData',
        error,
        'PlaylistCategoryService'
      );
    }
  }

  // TODO: 변경된 데이터가 제대로 조회되지 않음
  async retrievePlaylistCategoryDetailData(playlistCategoryId: number) {
    try {
      const queryBuilder = await this.playlistCategoryRepository
        .createQueryBuilder('playlistCategory')
        .leftJoinAndSelect(
          'playlistCategory.playlistCategoryDetails',
          'PlaylistCategoryDetail'
        )
        .where('playlistCategory.id = :playlistCategoryId', {
          playlistCategoryId: playlistCategoryId,
        })
        .getMany();

      return queryBuilder;
    } catch (error) {
      this.logger.error(
        'retrievePlaylistCategoryDetailData',
        error,
        'PlaylistCategoryService'
      );
    }
  }
}
