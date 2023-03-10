import {
  Attribute,
  ItemStatus,
  ItemTypeFromMysteryBox,
  Quality,
  UserSpendingBalanceDto,
} from '@libs/l2e-queries/dtos';
import {
  Headphone,
  HeadphoneBox,
  HeadphoneDock,
  MysteryBox,
  SpendingBalance,
  Sticker,
  User,
} from '@libs/l2e-queries/entities';
import {
  HeadphoneBoxRepository,
  HeadphoneDockRepository,
  HeadphoneRepository,
  MysteryBoxRepository,
  SpendingBalanceRepository,
  StickerRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BalanceHelperForHeadphone } from '@src/common/balance-helper';
import { EntityManager } from 'typeorm';
import { InventoriesFormulaService } from './inventories-formula.service';
import { INVENTORIES_CONFIG_OPTIONS } from './inventories.constant';
import { InventoriesModuleOptions } from './inventories.interface';

@Injectable()
export class InventoriesUtilService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    // @Inject(BalanceHelperForHeadphone)
    // private readonly balanceHelper: BalanceHelperForHeadphone,
    // @Inject(INVENTORIES_CONFIG_OPTIONS)
    // private readonly options: InventoriesModuleOptions,
    @Inject(forwardRef(() => InventoriesFormulaService))
    private readonly inventoriesFormula: InventoriesFormulaService,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,
    @InjectRepository(HeadphoneDock)
    private readonly headphoneDockRepository: HeadphoneDockRepository,
    @InjectRepository(HeadphoneBox)
    private readonly headphoneBoxRepository: HeadphoneBoxRepository,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @InjectRepository(Sticker)
    private readonly stickerRepository: StickerRepository,
    @InjectRepository(MysteryBox)
    private readonly mysteryBoxRepository: MysteryBoxRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository
  ) {}
  async retrieveUpdatedHeadphoneData(
    headphoneId: number,
    userId: number,
    isPaid = false
  ) {
    let result;
    try {
      const headphoneWithItem = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      const headphoneDocks = await this.headphoneDockRepository
        .createQueryBuilder('headphoneDock')
        .leftJoinAndSelect('headphoneDock.sticker', 'sticker')
        .leftJoinAndSelect('sticker.stickerDetail', 'stickerDetail')
        .where('headphoneDock.headphone = :headphoneId', {
          headphoneId: headphoneId,
        })
        .getMany();

      let spendingBalances: SpendingBalance[] = undefined;
      if (isPaid) {
        spendingBalances = await this.retrieveUpdatedSpendingBalances(userId);
      }

      result = {
        ...headphoneWithItem,
        spendingBalances,
        headphoneDocks,
      };

      return result;
    } catch (error) {
      // Create / Update ??????????????? ?????? ??? ??? ???????????? ?????????, ?????? ??????????????? exception throw??? ?????? ?????? ?????? ????????? ??????
      this.logger.error('retrieveUpdatedData', error, 'InventoriesService');
    }
  }

  async retrieveUpdatedHeadphoneBoxData(
    headphoneBoxId: number,
    userId: number,
    isPaid = false
  ) {
    let result;
    try {
      const headphoneBoxWithItem = await this.headphoneBoxRepository
        .createQueryBuilder('headphoneBox')
        .leftJoinAndSelect('headphoneBox.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneBoxId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      let spendingBalances: SpendingBalance[] = undefined;
      if (isPaid) {
        spendingBalances = await this.retrieveUpdatedSpendingBalances(userId);
      }

      result = {
        ...headphoneBoxWithItem,
        spendingBalances,
      };

      return result;
    } catch (error) {
      // Create / Update ??????????????? ?????? ??? ??? ???????????? ?????????, ?????? ??????????????? exception throw??? ?????? ?????? ?????? ????????? ??????
      this.logger.error('retrieveUpdatedData', error, 'InventoriesService');
    }
  }

  async retrieveUpdatedStickerData(
    stickerId: number,
    userId: number,
    isPaid = false
  ) {
    let result;
    try {
      const stickerWithItem = await this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .where('items.id = :itemId', {
          itemId: stickerId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      let spendingBalances: SpendingBalance[] = undefined;
      if (isPaid) {
        spendingBalances = await this.retrieveUpdatedSpendingBalances(userId);
      }

      result = {
        ...stickerWithItem,
        spendingBalances,
      };

      return result;
    } catch (error) {
      // Create / Update ??????????????? ?????? ??? ??? ???????????? ?????????, ?????? ??????????????? exception throw??? ?????? ?????? ?????? ????????? ??????
      this.logger.error('retrieveUpdatedData', error, 'InventoriesService');
    }
  }

  async retrieveOpenedMysteryBoxData(
    mysteryBoxId: number,
    userId: number,
    createdItemType: ItemTypeFromMysteryBox,
    createdItemResult: HeadphoneBox | Sticker | string
  ) {
    let result;
    try {
      const mysteryBoxWithItem = await this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'item')
        .where('mysteryBox.item = :itemId', {
          itemId: mysteryBoxId,
        })
        .andWhere('item.user = :userId', { userId })
        .getOne();

      const spendingBalances: SpendingBalance[] =
        await this.retrieveUpdatedSpendingBalances(userId);

      let createdItemFromOpenedMysteryBox: HeadphoneBox | Sticker | string;
      switch (createdItemType) {
        case ItemTypeFromMysteryBox.HEADPHONEBOX: {
          const headphoneBoxId = (createdItemResult as HeadphoneBox).item;
          createdItemFromOpenedMysteryBox = await this.headphoneBoxRepository
            .createQueryBuilder('headphoneBox')
            .leftJoinAndSelect('headphoneBox.item', 'items')
            .where('items.id = :itemId', {
              itemId: headphoneBoxId,
            })
            .andWhere('items.user = :userId', { userId: userId })
            .getOne();
          break;
        }
        case ItemTypeFromMysteryBox.STICKER: {
          const stickerId = (createdItemResult as Sticker).item;
          createdItemFromOpenedMysteryBox = await this.stickerRepository
            .createQueryBuilder('sticker')
            .leftJoinAndSelect('sticker.item', 'items')
            .where('items.id = :itemId', {
              itemId: stickerId,
            })
            .andWhere('items.user = :userId', { userId: userId })
            .getOne();
          break;
        }
        case ItemTypeFromMysteryBox.BLB:
          createdItemFromOpenedMysteryBox = createdItemResult;
          break;
      }

      result = {
        ...mysteryBoxWithItem,
        createdItemFromOpenedMysteryBox,
        spendingBalances,
      };

      return result;
    } catch (error) {
      // Create / Update ??????????????? ?????? ??? ??? ???????????? ?????????, ?????? ??????????????? exception throw??? ?????? ?????? ?????? ????????? ??????
      this.logger.error('retrieveUpdatedData', error, 'InventoriesService');
    }
  }

  async retrieveUserSpendingBalances(
    userId: number
  ): Promise<UserSpendingBalanceDto[]> {
    const userSpendingBalances = await this.retrieveUpdatedSpendingBalances(
      userId
    );

    if (!userSpendingBalances) {
      throw new NotFoundException('User spending balance not found');
    }

    return userSpendingBalances;
  }

  async retrieveHighestHeadphone(
    userId: number,
    headphoneId?: number
  ): Promise<Headphone> {
    const highestLevelHeadphoneQuery = await this.headphoneRepository
      .createQueryBuilder('headphone')
      .leftJoinAndSelect('headphone.item', 'items')
      .where('items.user = :userId', { userId })
      .andWhere('items.itemStatus IN (:itemStatuses)', {
        itemStatuses: [
          ItemStatus.IDLE,
          ItemStatus.LISTENING,
          ItemStatus.LEVELING,
        ],
      });

    if (headphoneId) {
      highestLevelHeadphoneQuery.andWhere('items.id != :headphoneId', {
        headphoneId: headphoneId,
      });
    }
    const highestLevelHeadphone = highestLevelHeadphoneQuery
      .orderBy('headphone.level', 'DESC')
      .getOne();

    // if (!highestLevelHeadphone) {
    //   throw new NotFoundException('currentHighestLevelHeadphone not found');
    // }

    return highestLevelHeadphone;
  }

  async calculateUpdatedTokenEarningLimit(
    userId: number,
    updatedDailyTokenEarningLimit: number
  ): Promise<[number, number]> {
    const currentTokenEarningLimit = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.dailyTokenEarningLimit', 'user.remainedTokenEarningLimit'])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!currentTokenEarningLimit) {
      throw new NotFoundException('currentTokenEarningLimit not found');
    }
    /**
     * 1. updated??? 50, current 30??????, added??? 20
     * 2. updated??? 30, current 50??????, added??? 30
     *
     */

    let updatedRemainedTokenEarningLimit = 0;
    // ????????? ????????????, dailyTokenEarningLimit??? ????????? ??????
    if (
      updatedDailyTokenEarningLimit >=
      currentTokenEarningLimit.dailyTokenEarningLimit
    ) {
      updatedRemainedTokenEarningLimit =
        currentTokenEarningLimit.remainedTokenEarningLimit -
        currentTokenEarningLimit.dailyTokenEarningLimit +
        updatedDailyTokenEarningLimit;
    } else {
      // ????????? ????????????, dailyTokenEarningLimit??? ????????? ??????
      updatedRemainedTokenEarningLimit = Math.min(
        updatedDailyTokenEarningLimit,
        currentTokenEarningLimit.remainedTokenEarningLimit
      );
    }

    return [updatedDailyTokenEarningLimit, updatedRemainedTokenEarningLimit];
  }

  async updateDailyTokenEarningLimitByHeadphoneInfo(
    userId: number,
    manager: EntityManager,
    // headphoneId??? ?????? ??? ???????????? ?????? ??????
    headphoneId?: number
  ) {
    const updatedHighestHeadphone = await this.retrieveHighestHeadphone(
      userId,
      headphoneId
    );
    if (!updatedHighestHeadphone) {
      return await manager.update(
        User,
        { id: userId },
        {
          dailyTokenEarningLimit: 0,
          remainedTokenEarningLimit: 0,
        }
      );
    }

    const updatedDailyTokenEarningLimit =
      this.inventoriesFormula.calculateDailyTokenEarningLimit(
        // TODO: tokenEarningLimitFormula??? quality??? ?????? ???????????? ??????, ?????? ?????? ?????? ??????
        Quality.COMMON,
        updatedHighestHeadphone.level
      );

    const [newDailyTokenEarningLimit, updatedRemainedTokenEarningLimit] =
      await this.calculateUpdatedTokenEarningLimit(
        userId,
        updatedDailyTokenEarningLimit
      );

    await manager.update(
      User,
      { id: userId },
      {
        dailyTokenEarningLimit: newDailyTokenEarningLimit,
        remainedTokenEarningLimit: updatedRemainedTokenEarningLimit,
      }
    );
  }

  sortQuality(qualities: Quality[]): Quality[] {
    const qualitiesOrder = Object.values(Quality);
    const sortedQualities = qualities.sort((a, b) => {
      return qualitiesOrder.indexOf(a) - qualitiesOrder.indexOf(b);
    });

    return sortedQualities;
  }

  sortAttribute(attributes: Attribute[]): Attribute[] {
    const attributesOrder = Object.values(Attribute);
    const sortedAttributes = attributes.sort((a, b) => {
      return attributesOrder.indexOf(a) - attributesOrder.indexOf(b);
    });

    return sortedAttributes;
  }

  private async retrieveUpdatedSpendingBalances(userId: number) {
    return await this.spendingBalanceRepository
      .createQueryBuilder('spendingBalance')
      // .leftJoin('spendingBalance.owner', 'users')
      .where('spendingBalance.owner = :userId', { userId: userId })
      .select('spendingBalance.id')
      .addSelect('spendingBalance.tokenSymbol')
      .addSelect('spendingBalance.balance')
      .addSelect('spendingBalance.availableBalance')
      // .where('users.id = :userId', { userId: userId })
      .getMany();
  }
}
