import { DynamicModule, Module } from '@nestjs/common';
import { CONFIG_BASE_CRAWLER_OPTIONS } from '@base-crawlers/base-crawler.constant';
import { BaseCrawlerOptions } from '@base-crawlers/base-crawler.interface';
import { BaseCrawlerService } from '@base-crawlers/base-crawler.service';
import { CrawlerLogModule } from '@crawler-logs/crawler-log.module';
import { DepositModule } from '@deposits/deposit.module';

@Module({
  imports: [CrawlerLogModule, DepositModule],
})
export class BaseCrawlerModule {
  static forRoot(options: BaseCrawlerOptions): DynamicModule {
    return {
      module: BaseCrawlerModule,
      providers: [
        {
          provide: CONFIG_BASE_CRAWLER_OPTIONS,
          useValue: options,
        },
        BaseCrawlerService,
      ],
      exports: [BaseCrawlerService],
    };
  }
}
