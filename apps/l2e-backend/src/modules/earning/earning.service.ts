import { StatusListenHistory, EarningSocketDto } from '@libs/l2e-queries/dtos';
import { Headphone, User, ListenHistory, TracksFormula } from '@libs/l2e-queries/entities';
import {
  HeadphoneRepository,
  ListenHistoryRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BigNumber from 'bignumber.js';
import { PERCENT_FOR_USER, TOKEN_SYMBOL } from '@libs/l2e-utils/constants';
import { calculationTokenBySecond } from '@libs/l2e-utils/util-functions';

@Injectable()
export class EarningService {
  constructor(
    @InjectRepository(ListenHistory)
    private readonly listenHistoryRepository: ListenHistoryRepository,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
  ) { }

  async processCalculation(earningDatas: EarningSocketDto[]) {
    const { userId, headphoneId } = earningDatas[0];
    let totalTokenEarn = 0;

    const headphone = await this.findHeadphone(headphoneId);
    const userLimit = await this.getLimitEarnTodayForUser(userId)
    let limitTokenOneDay = userLimit.remainedTokenEarningLimit; //Take out the limit of how much money you can earn
    for (const earn of earningDatas) {
      const token = calculationTokenBySecond(earn.playTime, headphone.battery, headphone.efficiency);
      const amountToken = limitTokenOneDay < token ? limitTokenOneDay : token;
      totalTokenEarn = totalTokenEarn + amountToken;
      limitTokenOneDay = limitTokenOneDay - amountToken < 0 ? 0 : limitTokenOneDay - amountToken;
    }
    // minus 10% of the token for the user
    const amount = new BigNumber(totalTokenEarn).times(PERCENT_FOR_USER).toString();
    return { amount, symbol: TOKEN_SYMBOL }
  }

  async findHeadphone(headphoneId: number) {
    const headphone = await this.headphoneRepository.findOne({
      where: { item: headphoneId }
    });
    if (!headphone) {
      throw new HttpException('Headpone does not exist', HttpStatus.NOT_FOUND);
    }
    return headphone;
  }

  // get token in 1 day of user or headphone
  async getTotalTokenEarnOneDay(headphoneId: number, userId: number) {
    const query = this.listenHistoryRepository.createQueryBuilder('lh')
      .select('sum(token_earned) as total ')
      .where('DATE(lh.created_at) = DATE(CURDATE())')
      .andWhere('user_id = :userId', { userId: userId })
      .andWhere('status = :status', { status: StatusListenHistory.LISTEN });

    if (headphoneId) {
      query.andWhere('headphone_id = :headphoneId', { headphoneId: headphoneId });
    }

    return await query.getRawOne();
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
    return user
  }
}
