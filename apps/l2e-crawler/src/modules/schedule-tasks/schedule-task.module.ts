import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleTaskService } from '@schedule-tasks/schedule-task.service';
import { BaseCrawlerModule } from '../base-crawlers/base-crawler.module';
import { DepositABI } from '@libs/l2e-utils/abis';
import { WithdrawModule } from '@withdraws/withdraw.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BaseCrawlerModule.forRoot({
      abi: DepositABI,
      contractAddress: process.env.TREASURY_CONTRACT_ADDRESS,
      startBlock: +process.env.CRAWLER_START_BLOCK,
      blockStep: +process.env.CRAWLER_BLOCK_STEP,
    }),
    WithdrawModule,
  ],
  providers: [ScheduleTaskService],
})
export class ScheduleTaskModule {}
