import { Order } from '@libs/l2e-pagination/constants';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import {
  CreatePlaylistCategoryDto,
  Display,
  PlaylistDto,
  UpdatePlaylistCategoryDto,
} from '@libs/l2e-queries/dtos';
import {
  PlaylistCategory,
  PlaylistCategoryDetail,
} from '@libs/l2e-queries/entities';
import {
  PlaylistCategoryDetailRepository,
  PlaylistCategoryRepository,
} from '@libs/l2e-queries/repositories';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { DataSource } from 'typeorm';
import { PlaylistCategoryUtilService } from './playlist-category-util.service';

@Injectable()
export class PlaylistCategoryService {
  constructor(
    @InjectRepository(PlaylistCategory)
    private readonly playlistCategoryRepository: PlaylistCategoryRepository,
    @InjectRepository(PlaylistCategoryDetail)
    private readonly playlistCategoryDetailRepository: PlaylistCategoryDetailRepository,
    @Inject(PlaylistCategoryUtilService)
    private readonly playlistManagerUtilService: PlaylistCategoryUtilService,
    private readonly dataSource: DataSource
  ) {}

  async createPlaylistCategory(
    createPlaylistCategoryDto: CreatePlaylistCategoryDto
  ) {
    try {
      const { categoryName, categoryImg, categoryOrder } =
        createPlaylistCategoryDto;

      let savedPlaylistCategory;
      await this.dataSource.transaction(async (manager) => {
        const newPlaylist = this.playlistCategoryRepository.create({
          categoryDisplay: Display.NOTSHOW,
          categoryName,
          categoryImg,
          categoryOrder,
        });
        savedPlaylistCategory = await manager.save(newPlaylist);
      });

      return await this.playlistManagerUtilService.retrievePlaylistCategoryData(
        savedPlaylistCategory.id
      );
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchPlaylistCategory(pageOptionsDto: PageOptionsDto) {
    try {
      const queryBuilder = this.playlistCategoryRepository
        .createQueryBuilder('playlistCategory')
        .leftJoinAndSelect(
          'playlistCategory.playlistCategoryDetails',
          'playlistCategoryDetail'
        )
        .leftJoinAndSelect(
          'playlistCategoryDetail.playlist',
          'playlist',
          'playlist.playlistDisplay = :playlistDisplay',
          {
            playlistDisplay: Display.SHOW,
          }
        )
        .where('playlistCategory.categoryDisplay = :categoryDisplay', {
          categoryDisplay: Display.SHOW,
        });

      queryBuilder
        .orderBy('playlistCategory.categoryOrder', Order.ASC)
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

  async fetchPlaylistCategoryById(
    pageOptionsDto: PageOptionsDto,
    playlistCategoryId: number
  ) {
    try {
      const queryBuilder = this.playlistCategoryRepository
        .createQueryBuilder('playlistCategory')
        .leftJoinAndSelect(
          'playlistCategory.playlistCategoryDetails',
          'playlistCategoryDetail'
        )
        .leftJoinAndSelect(
          'playlistCategoryDetail.playlist',
          'playlist',
          'playlist.playlistDisplay = :playlistDisplay',
          {
            playlistDisplay: Display.SHOW,
          }
        )
        .where(
          'playlistCategoryDetail.playlistCategory = :playlistCategoryId',
          {
            playlistCategoryId,
          }
        )
        .andWhere('playlistCategory.categoryDisplay = :categoryDisplay', {
          categoryDisplay: Display.SHOW,
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

  async addPlaylist(addPlaylistDto: PlaylistDto) {
    try {
      const { playlistCategoryId, playlistIds } = addPlaylistDto;

      const playlistCategory = await this.playlistCategoryRepository.findOneBy({
        id: playlistCategoryId,
      });
      if (!playlistCategory)
        throw new NotFoundException('playlistCategory does not exist');

      await this.dataSource.transaction(async (manager) => {
        for (const playlistId of playlistIds) {
          const newPlaylistCategoryDetail =
            this.playlistCategoryDetailRepository.create({
              playlistCategory,
              playlist: playlistId,
            });
          await manager.save(newPlaylistCategoryDetail);
        }
      });

      const result =
        await this.playlistManagerUtilService.retrievePlaylistCategoryDetailData(
          playlistCategoryId
        );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async subtractPlaylist(subtractPlaylistDto: PlaylistDto) {
    try {
      const { playlistCategoryId, playlistIds } = subtractPlaylistDto;
      const playlistCategory = await this.playlistCategoryRepository.findOneBy({
        id: playlistCategoryId,
      });

      if (!playlistCategory)
        throw new NotFoundException('playlistCategory does not exist');

      await this.dataSource.transaction(async (manager) => {
        for (const playlistId of playlistIds) {
          await manager.delete(PlaylistCategoryDetail, {
            playlistCategory,
            playlist: playlistId,
          });
        }
      });

      const result =
        await this.playlistManagerUtilService.retrievePlaylistCategoryDetailData(
          playlistCategoryId
        );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
    return;
  }

  async updatePlaylistCategory(
    updatePlaylistCategoryDto: UpdatePlaylistCategoryDto
  ) {
    try {
      const {
        playlistCategoryId,
        categoryName,
        categoryImg,
        categoryOrder,
        categoryDisplay,
      } = updatePlaylistCategoryDto;
      const playlistCategory = await this.playlistCategoryRepository.findOneBy({
        id: playlistCategoryId,
      });
      if (!playlistCategory)
        throw new NotFoundException('playlistCategory does not exist');

      await this.dataSource.transaction(async (manager) => {
        await manager.update(PlaylistCategory, playlistCategoryId, {
          categoryName,
          categoryImg,
          categoryOrder,
          categoryDisplay,
        });
      });

      const result =
        await this.playlistManagerUtilService.retrievePlaylistCategoryDetailData(
          playlistCategoryId
        );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async deletePlaylistCategory(playlistCategoryId: number) {
    try {
      const playlistCategory = await this.playlistCategoryRepository.findOneBy({
        id: playlistCategoryId,
      });
      if (!playlistCategory)
        throw new NotFoundException('playlistCategory does not exist');

      await this.dataSource.transaction(async (manager) => {
        await manager.delete(PlaylistCategory, playlistCategoryId);
      });
    } catch (error) {
      exceptionHandler(error);
    }
  }
}
