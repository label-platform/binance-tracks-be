import { Injectable } from '@nestjs/common';
import { Cron, Timeout } from '@nestjs/schedule';
import { BaseCrawlerService } from '@base-crawlers/base-crawler.service';
import {
  CHECK_WITHDRAWN_TRANSACTION_INTERVAL,
  REQUEST_WITHDRAWN_NFT_INTERVAL,
  REQUEST_WITHDRAWN_TOKEN_INTERVAL,
  TIME_OUT_TO_START_CRAWLER_IN_MILLISECONDS,
  TIME_OUT_TO_START_HANDLE_REQUEST_WITHDRAW,
} from '@schedule-tasks/schedule-task.constant';
import { WithdrawService } from '@withdraws/withdraw.service';

@Injectable()
export class ScheduleTaskService {
  constructor(
    private readonly baseCrawlerService: BaseCrawlerService,
    private readonly withdrawService: WithdrawService
  ) {}

  @Timeout(TIME_OUT_TO_START_CRAWLER_IN_MILLISECONDS)
  handleCrawlDeposit() {
    this.baseCrawlerService.scan();
  }

  @Cron(`*/${REQUEST_WITHDRAWN_TOKEN_INTERVAL} * * * * *`)
  handleRequestWithDrawToken() {
    this.withdrawService.handleRequestWithDrawToken();
  }

  @Cron(`*/${REQUEST_WITHDRAWN_NFT_INTERVAL} * * * * *`)
  handleRequestWithDrawNft() {
    this.withdrawService.handleRequestWithDrawNft();
  }

  @Cron(`*/${CHECK_WITHDRAWN_TRANSACTION_INTERVAL} * * * * *`)
  checkWithdrawTransaction() {
    this.withdrawService.checkWithdrawTransaction();
  }
}
