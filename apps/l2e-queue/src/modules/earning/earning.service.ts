import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import {
  EarningSocketDto,
  StatusListenHistory,
  TokenSymbol,
} from '@libs/l2e-queries/dtos';
import {
  HeadphoneRepository,
  ListenHistoryRepository,
  SongRepository,
  SpendingBalanceRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_CHANCE,
  HEADPHONE_EARNING_RATE,
  INCREASED_CHANCE_FOR_EACH_LUCK_POINT,
  ONE_MINUTE,
  PERCENT_FOR_MUSICIAN,
  PERCENT_FOR_USER,
  SYSTEM_VALUE_FOR_LUCKY_BOX,
  TIME_FOR_ONE_ENERGY,
  TIME_REWARD_TOKEN,
} from '@libs/l2e-utils/constants';
import BigNumber from 'bignumber.js';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Headphone,
  ListenHistory,
  Song,
  SpendingBalance,
  TracksFormula,
  User,
} from '@libs/l2e-queries/entities';
import { DataSource, EntityManager } from 'typeorm';
import { MysteryBoxService } from './mystery-box.service';
import {
  calculationTokenBySecond,
  convertNumberWithDecimalCeil,
} from '@libs/l2e-utils/util-functions';

@Injectable()
export class EarningService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,

    @InjectRepository(Song)
    private readonly songRepository: SongRepository,

    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,

    private readonly mysteryBoxService: MysteryBoxService,

    private dataSource: DataSource
  ) {}

  async processCalculation(earningDatas: EarningSocketDto[]) {
    console.log('Start processCalculation');
    console.log('earningDatas', earningDatas[0]);
    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          const { userId, headphoneId, startTime } = earningDatas[0];
          let totalTokenEarn = 0;

          console.log('Start get headphone');
          const headphone = await this.findHeadphone(headphoneId);
          let totalCumulativePlayTime = 0;
          console.log('Start get limit earning today for user');
          const limitUser = await this.getLimitEarnTodayForUser(userId);
          let limitTokenOneDay =
            limitUser.dailyTokenEarningLimit -
            limitUser.remainedTokenEarningLimit; //Take out the limit of how much money you can earn
          console.log('limitTokenOneDay', limitTokenOneDay);

          // loop through records sent from redis
          console.log('Start loop through records sent from redis');
          for (const earn of earningDatas) {
            // calculate the token received based on the specified number of seconds
            const token = calculationTokenBySecond(
              earn.playTime,
              headphone.battery,
              headphone.efficiency
            );
            const amountToken =
              limitTokenOneDay < token ? limitTokenOneDay : token;
            earn['tokenEarn'] = amountToken;
            totalTokenEarn = totalTokenEarn + amountToken;
            totalCumulativePlayTime = totalCumulativePlayTime + earn.playTime;

            // process each song and charge the musician
            if (limitTokenOneDay > 0) {
              await this.processCalculationForOneSong(earn, manager);
            }
            limitTokenOneDay =
              limitTokenOneDay - amountToken < 0
                ? 0
                : limitTokenOneDay - amountToken;
          }

          // minus 10% of the token for the user
          const realTokenForUser = new BigNumber(totalTokenEarn)
            .times(PERCENT_FOR_USER)
            .toString();

          // plus token for listener
          console.log(
            'Start update total token for user, realTokenForUser: ',
            realTokenForUser
          );
          await this.updateTotalToken(realTokenForUser, userId, manager);

          console.log(
            'Update remain token earning limit, totalTokenEarn: ',
            totalTokenEarn
          );
          await this.updateRemainedTokenEarningLimit(
            userId,
            totalTokenEarn,
            manager
          );

          console.log(
            'Update headphone cumulative play time, totalCumulativePlayTime: ',
            totalCumulativePlayTime
          );
          await this.insertListenHistory(
            totalCumulativePlayTime,
            null,
            userId,
            headphoneId,
            startTime,
            realTokenForUser,
            manager,
            StatusListenHistory.LISTEN
          );

          // calculate the percentage of receiving Mystery box
          console.log(
            'Start calculate the percentage of receiving Mystery box'
          );
          if (
            await this.calculatePercentageGetMysteryBox(
              totalCumulativePlayTime,
              headphone
            )
          ) {
            // Call api create Mystery box
            await this.mysteryBoxService.callApiService({
              userId,
              headphoneId,
              energyConsumption: totalCumulativePlayTime,
            });
          } else {
            console.log(`User:${userId} did not receive Mysterbox`);
          }
          console.log('End processCalculation');
        });
    } catch (e) {
      console.log(e);
      console.log('End processCalculation');
    }
  }

  async findHeadphone(headphoneId: number) {
    const headphone = await this.headphoneRepository.findOne({
      where: { item: headphoneId },
    });
    if (!headphone) {
      throw new NotFoundException('Headphone Not found');
    }
    return headphone;
  }

  async updateTotalToken(
    totalTokenEarn: string,
    userId: number,
    manager: EntityManager
  ) {
    const spendingUser = await manager
      .getRepository(SpendingBalance)
      .createQueryBuilder('sb')
      .useTransaction(true)
      .setLock('pessimistic_write')
      .where('owner_id = :id AND token_symbol = :symbol', {
        id: userId,
        symbol: TokenSymbol.BLB,
      })
      .getOne();
    if (!spendingUser) {
      throw new NotFoundException('SpendingBalance Not found');
    }
    const totalToken = new BigNumber(spendingUser.balance)
      .plus(totalTokenEarn)
      .toString();

    spendingUser.balance = parseFloat(totalToken);
    spendingUser.availableBalance = parseFloat(totalToken);
    await manager.update(
      SpendingBalance,
      { owner: userId, tokenSymbol: TokenSymbol.BLB },
      {
        balance: parseFloat(totalToken),
        availableBalance: parseFloat(totalToken),
      }
    );
  }

  async processCalculationForOneSong(earningData, manager: EntityManager) {
    // find musician
    const { playTime, songId, headphoneId, startTime, tokenEarn } = earningData;
    const musician = await this.songRepository
      .createQueryBuilder('song')
      .select(['users.id as userId'])
      .leftJoin('song.owner', 'users')
      // .leftJoin('owner.user', 'users')
      .where('song.id = :songId', { songId: songId })
      .getRawOne();
    if (!musician) {
      throw new NotFoundException('Musician Not found');
    }
    if (playTime > ONE_MINUTE) {
      const tokenForMusician = tokenEarn * PERCENT_FOR_MUSICIAN;
      // update token for musician
      await this.updateTotalToken(
        tokenForMusician.toString(),
        musician.userId,
        manager
      );
      // save reward history for listener
      await this.insertListenHistory(
        playTime,
        songId,
        musician.userId,
        headphoneId,
        startTime,
        tokenForMusician,
        manager,
        StatusListenHistory.REWARD
      );
    }
  }

  async insertListenHistory(
    cumulativePlayTime,
    songId,
    userId,
    headphoneId,
    startTime,
    tokenEarn,
    manager: EntityManager,
    status: StatusListenHistory
  ) {
    const listenHistory = new ListenHistory();
    listenHistory.userId = userId;
    listenHistory.songId = songId;
    listenHistory.headphoneId = headphoneId;
    listenHistory.startTime = new Date(startTime).getTime().toString();
    listenHistory.endTime = new Date().getTime().toString();
    listenHistory.duration = cumulativePlayTime.toString();
    listenHistory.tokenEarned = tokenEarn;
    listenHistory.status = status;
    return await manager.getRepository(ListenHistory).save(listenHistory);
  }

  // calculate the percentage of receiving Mystery box
  async calculatePercentageGetMysteryBox(
    cumulativePlayTime: number,
    headphone: Headphone
  ) {
    const usedEnergy =
      Math.floor(cumulativePlayTime / TIME_REWARD_TOKEN) /
      (TIME_FOR_ONE_ENERGY / TIME_REWARD_TOKEN);
    const percentGetMysteryBox = Math.pow(
      usedEnergy *
        (DEFAULT_CHANCE +
          headphone.luck * INCREASED_CHANCE_FOR_EACH_LUCK_POINT),
      SYSTEM_VALUE_FOR_LUCKY_BOX
    ).toFixed(2);
    const random = (Math.random() * 100).toFixed(2);
    if (random <= percentGetMysteryBox) return true;
    return false;
  }

  async updateRemainedTokenEarningLimit(
    userId: number,
    tokenEarningAmount: number,
    manager: EntityManager
  ) {
    const convertedTokenEarningAmount = Math.abs(tokenEarningAmount);

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      select: ['remainedTokenEarningLimit', 'dailyTokenEarningLimit'],
    });
    if (!user) {
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    }

    let remainedTokenEarningLimit = convertNumberWithDecimalCeil(
      user.remainedTokenEarningLimit + convertedTokenEarningAmount,
      2
    );
    if (remainedTokenEarningLimit > user.dailyTokenEarningLimit) {
      remainedTokenEarningLimit = user.dailyTokenEarningLimit;
    }
    await manager.update(
      User,
      { id: userId },
      { remainedTokenEarningLimit: remainedTokenEarningLimit }
    );
  }

  async getLimitEarnTodayForUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      select: ['remainedTokenEarningLimit', 'dailyTokenEarningLimit'],
    });
    if (!user) {
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
