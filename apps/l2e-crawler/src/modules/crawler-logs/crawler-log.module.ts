import { Module } from '@nestjs/common';
import { CrawlerLogService } from '@crawler-logs/crawler-log.service';
import { CrawlerLog } from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

const CrawlerLogModel = TypeOrmModule.forFeature([CrawlerLog]);

@Module({
  imports: [CrawlerLogModel],
  providers: [CrawlerLogService],
  exports: [CrawlerLogService],
})
export class CrawlerLogModule {}
