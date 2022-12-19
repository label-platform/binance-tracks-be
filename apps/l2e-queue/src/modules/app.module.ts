import { Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/l2e-database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { EarningModule } from '../modules/earning/earning.module';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ActivationCode,
  Headphone,
  HeadphoneBox,
  HeadphoneDock,
  Item,
  ItemSale,
  LoginSession,
  MysteryBox,
  Nft,
  Pinballhead,
  Playlist,
  PlaylistDetail,
  SaleHistory,
  Song,
  SpendingBalance,
  Sticker,
  TracksFormula,
  User,
  UserOtp,
} from '@libs/l2e-queries/entities';
import { HealthzModule } from './healthz/healthz.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivationCode,
      Headphone,
      HeadphoneBox,
      HeadphoneDock,
      Item,
      ItemSale,
      LoginSession,
      MysteryBox,
      Nft,
      Pinballhead,
      Playlist,
      PlaylistDetail,
      SaleHistory,
      Song,
      SpendingBalance,
      Sticker,
      TracksFormula,
      User,
      UserOtp,
    ]),
    DatabaseModule,
    EarningModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    HealthzModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
