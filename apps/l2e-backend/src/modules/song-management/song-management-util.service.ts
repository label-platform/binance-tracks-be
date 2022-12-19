import { Item, Song } from '@libs/l2e-queries/entities';
import { ItemRepository, SongRepository } from '@libs/l2e-queries/repositories';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SongManagementUtilService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(Song)
    private readonly songRepository: SongRepository,
    @InjectRepository(Item)
    private readonly itemRepository: ItemRepository,
    private readonly dataSource: DataSource
  ) {}

  async retrieveSongDataBys3name(s3name: string) {
    try {
      const song = await this.songRepository.findOne({
        relations: ['item'],
        where: { s3name },
      });
      return song;
    } catch (error) {
      this.logger.error(
        'retrieveSongDataBys3name',
        error,
        'SongManagementService'
      );
    }
  }

  async retrieveSongDataById(songId: number) {
    try {
      const song = await this.songRepository.findOne({
        relations: ['item'],
        where: { id: songId },
      });
      return song;
    } catch (error) {
      this.logger.error('retrieveSongDataById', error, 'SongManagementService');
    }
  }
}
