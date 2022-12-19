import {
  ItemInfoForBalanceCheck,
  UserSpendingBalanceDto,
} from '@libs/l2e-queries/dtos';
import { SpendingBalance } from '@libs/l2e-queries/entities';
import { SpendingBalanceRepository } from '@libs/l2e-queries/repositories';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * @deprecated
 */
export abstract class BalanceHelper {
  constructor(
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository
  ) {
    this._royaltyFee = Number(process.env.ROYALTY_FEE);
    this._artistFee = Number(process.env.ARTIST_FEE);
  }

  protected _royaltyFee: number;
  protected _artistFee: number;

  // 유저가 spending wallet에 소유한 모든 balance 정보를 가져옴
  async getBalances(userId: number): Promise<UserSpendingBalanceDto[]> {
    return this.spendingBalanceRepository
      .createQueryBuilder('spendingBalance')
      .where('spendingBalance.owner = :userId', { userId: userId })
      .select('spendingBalance.id')
      .addSelect('spendingBalance.tokenSymbol')
      .addSelect('spendingBalance.balance')
      .addSelect('spendingBalance.availableBalance')
      .getMany();
  }

  abstract checkBalance(
    balances: UserSpendingBalanceDto[],
    itemInfoForBalanceCheck: ItemInfoForBalanceCheck
  ): Promise<boolean>;
}
/**
 * @deprecated
 */
@Injectable()
export class BalanceHelperForHeadphone extends BalanceHelper {
  async checkBalance(
    balances: UserSpendingBalanceDto[],
    itemInfoForBalanceCheck: ItemInfoForBalanceCheck
  ): Promise<boolean> {
    // TODO: purpose: Levelup, userId와 현재 헤드폰 정보 기반으로, 다음 레벨로 업그레이드 시 필요한 밸런스가 충분한지 확인한다

    // TODO purpose: Boost, userId와 현재 헤드폰 정보 기반으로, 다음 레벨로 부스팅 시 필요한 밸런스가 충분한지 확인한다

    // TODO purpose: Mint, userId와 현재 헤드폰들 정보 기반으로, 민트 시 필요한 밸런스가 충분한지 확인한다

    // TODO purpose: Charging, userId와 현재 헤드폰들 정보 기반으로, charging 필요한 밸런스가 충분한지 확인한다

    // TODO: purpose: Dock Open, userId와 현재 헤드폰 dock 정보 기반으로, dock open 필요한 밸런스가 충분한지 확인한다
    return true;
  }
}
/**
 * @deprecated
 */
@Injectable()
export class BalanceHelperForHeadphoneBox extends BalanceHelper {
  async checkBalance(
    balances: UserSpendingBalanceDto[],
    itemInfoForBalanceCheck: ItemInfoForBalanceCheck
  ): Promise<boolean> {
    // TODO purpose: Boost, userId와 현재 헤드폰박스 정보 기반으로, 오픈 부스팅 시 필요한 밸런스가 충분한지 확인한다
    return true;
  }
}
/**
 * @deprecated
 */
@Injectable()
export class BalanceHelperForSticker extends BalanceHelper {
  async checkBalance(
    balances: UserSpendingBalanceDto[],
    itemInfoForBalanceCheck: ItemInfoForBalanceCheck
  ): Promise<boolean> {
    // TODO: purpose: Enhance, userId와 스티커들 정보 기반으로, enhance 시 필요한 밸런스가 충분한지 확인한다

    // TODO: purpose: Insert sticker, userId와 스티커들 정보 기반으로, 스티커 삽입 시 필요한 밸런스가 충분한지 확인한다
    return true;
  }
}
/**
 * @deprecated
 */
@Injectable()
export class BalanceHelperForMysteryBox extends BalanceHelper {
  async checkBalance(
    balances: UserSpendingBalanceDto[],
    itemInfoForBalanceCheck: ItemInfoForBalanceCheck
  ): Promise<boolean> {
    // TODO purpose: Boost, mysterybox 정보 기반으로, 오픈 부스팅 시 필요한 밸런스가 충분한지 확인한다

    // TODO: purpose: Open, mysterybox 정보 기반으로, mysterybox 오픈 시 필요한 밸런스가 충분한지 확인한다
    return true;
  }
}
