import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrawlerLog } from '@libs/l2e-queries/entities';
import { CrawlerLogRepository } from '@libs/l2e-queries/repositories';
import { CreateCrawlerLogDto } from '@libs/l2e-queries/dtos';

@Injectable()
export class CrawlerLogService {
  constructor(
    @InjectRepository(CrawlerLog)
    private readonly crawlerLogRepository: CrawlerLogRepository
  ) {}
  async createCrawlerLog(
    createCrawlerLogDto: CreateCrawlerLogDto
  ): Promise<CrawlerLog> {
    try {
      const createdCrawlerLog: CrawlerLog =
        await this.crawlerLogRepository.create(createCrawlerLogDto);
      await createdCrawlerLog.save();
      return createdCrawlerLog;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getLastestCrawlerLog(contractAddress: string): Promise<CrawlerLog> {
    try {
      const lastestCrawlerLog: CrawlerLog =
        await this.crawlerLogRepository.findOne({
          where: {
            contractAddress,
          },
          order: {
            no: 'DESC',
          },
        });

      return lastestCrawlerLog;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
