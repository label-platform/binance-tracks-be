import { Headphone, ListenHistory, Song, SpendingBalance, User } from '@libs/l2e-queries/entities';
import { HeadphoneRepository, SongRepository, SpendingBalanceRepository } from '@libs/l2e-queries/repositories';
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningController } from './earning.controller';
import { EarningProcessor } from './earning.processor';
import { EarningService } from './earning.service';
import { HttpModule } from '@nestjs/axios'
import { MysteryBoxService } from './mystery-box.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListenHistory,
      SpendingBalanceRepository,
      SongRepository,
      Song,
      SpendingBalance,
      Headphone,
      HeadphoneRepository,
      User
    ]),
    BullModule.registerQueue({
      name: 'earning',
    }),
    HttpModule,

  ],
  controllers: [EarningController],

  providers: [EarningService, EarningProcessor, Logger, MysteryBoxService, HttpModule],
})
export class EarningModule { }
