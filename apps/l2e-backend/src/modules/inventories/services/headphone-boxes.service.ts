import {
  HeadphoneBoxRepository,
  HeadphoneDockRepository,
  HeadphoneRepository,
  ItemRepository,
  MysteryBoxRepository,
  PinballheadRepository,
  SpendingBalanceRepository,
  StickerRepository,
} from '@libs/l2e-queries/repositories';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Headphone,
  HeadphoneBox,
  HeadphoneDock,
  Item,
  MysteryBox,
  Pinballhead,
  SpendingBalance,
  Sticker,
} from '@libs/l2e-queries/entities';
import {
  ItemType,
  Quality,
  CreateHeadphoneBoxDto,
  UpdateHeadphoneBoxDto,
  ItemStatus,
  OpenHeadphoneBoxDto,
  DockStatus,
} from '@libs/l2e-queries/dtos';
import { INVENTORIES_CONFIG_OPTIONS } from '../inventories.constant';
import { InventoriesModuleOptions } from '../inventories.interface';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import { DataSource } from 'typeorm';
import { InventoriesFormulaService } from '../inventories-formula.service';
import { exceptionHandler } from '@src/common/exception-handler';
import { LocalDateTime } from '@js-joda/core';
import { PoliciesService } from '@src/modules/policies/policies.service';
import { BalanceHelperForHeadphoneBox } from '@src/common/balance-helper';
import { InventoriesUtilService } from '../inventories-util.service';

@Injectable()
export class HeadphoneBoxesService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(INVENTORIES_CONFIG_OPTIONS)
    private readonly options: InventoriesModuleOptions,
    @Inject(InventoriesFormulaService)
    private readonly inventoriesFormula: InventoriesFormulaService,
    @Inject(InventoriesUtilService)
    private readonly inventoriesUtil: InventoriesUtilService,
    // @Inject(BalanceHelperForHeadphoneBox)
    // private readonly balanceHelper: BalanceHelperForHeadphoneBox,
    @InjectRepository(Item) private readonly itemRepository: ItemRepository,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,
    @InjectRepository(HeadphoneDock)
    private readonly headphoneDockRepository: HeadphoneDockRepository,
    @InjectRepository(HeadphoneBox)
    private readonly headphoneBoxRepository: HeadphoneBoxRepository,
    @InjectRepository(MysteryBox)
    private readonly mysteryBoxRepository: MysteryBoxRepository,
    @InjectRepository(Sticker)
    private readonly stickerRepository: StickerRepository,
    @InjectRepository(Pinballhead)
    private readonly pinballheadRepository: PinballheadRepository,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @Inject(PoliciesService)
    private readonly policiesService: PoliciesService,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  /**
   * @deprecated
   */

  async createHeadphoneBox(createHeadphoneBoxDto: CreateHeadphoneBoxDto) {
    let createdHeadphoneBox: HeadphoneBox;

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // create item
          // imgURL 동적으로 입력 받아야 함 또는 생성 필요
          const newItem = this.itemRepository.create({
            user: createHeadphoneBoxDto.userId,
            imgUrl: `https://i.imgur.com/XqQXQ.png`,
            itemStatus: ItemStatus.NOT_OPENED,
            type: ItemType.HEADPHONEBOX,
          });

          const item = await manager.save(newItem);

          // create headphone box
          // quality를 확률에 맞춰 생성
          const newHeadphoneBox = this.headphoneBoxRepository.create({
            item: item.id,
            parentId1: createHeadphoneBoxDto.parentId1,
            parentId2: createHeadphoneBoxDto.parentId2,
            quality: Quality.COMMON,
            // openingTime: LocalDateTime.now().plusHours(1),
          });

          createdHeadphoneBox = await manager.save(newHeadphoneBox);
        });

      return createdHeadphoneBox;
    } catch (error) {
      this.logger.error(
        error,
        `createHeadphoneBox(${createHeadphoneBoxDto.userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  // TODO: Refactoring 대상
  async openHeadphoneBox(
    openHeadphoneBoxDto: OpenHeadphoneBoxDto,
    userId: number
  ) {
    try {
      const headphoneBox = await this.headphoneBoxRepository
        .createQueryBuilder('headphoneBox')
        .leftJoinAndSelect('headphoneBox.item', 'items')
        .where('items.id = :itemId', {
          itemId: openHeadphoneBoxDto.headphoneBoxId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!headphoneBox) {
        throw new NotFoundException('HeadphoneBox Not found');
      }

      /* TODO: Mint 및 headphone parent가 완전히 필요없어지면 삭제 필요
      const headphone1Parent = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneBox.parentId1,
        })
        .getOne();

      if (!headphone1Parent) {
        throw new NotFoundException('Headphone1Parent Not found');
      }

      const headphoneDocks1Parent = await this.headphoneDockRepository
        .createQueryBuilder('headphoneDock')
        .where('headphoneDock.headphone = :headphoneId', {
          headphoneId: headphoneBox.parentId1,
        })
        .getMany();

      if (headphoneDocks1Parent.length === 0) {
        throw new NotFoundException('HeadphoneDocks1Parent Not found');
      }

      const headphone2Parent = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneBox.parentId2,
        })
        .getOne();

      if (!headphone2Parent) {
        throw new NotFoundException('Headphone2Parent Not found');
      }

      const headphoneDocks2Parent = await this.headphoneDockRepository
        .createQueryBuilder('headphoneDock')
        .where('headphoneDock.headphone = :headphoneId', {
          headphoneId: headphoneBox.parentId2,
        })
        .getMany();

      if (headphoneDocks2Parent.length === 0) {
        throw new NotFoundException('HeadphoneDocks2Parent Not found');
      }
      */

      const itemInfo = headphoneBox.item as Item;
      this.policiesService.updateItemStatus(itemInfo).toOpened();

      // 신규 헤드폰 정보 생성
      const createdHeadphoneFromBox =
        this.inventoriesFormula.getHeadphoneFromHeadphoneBox(
          headphoneBox.quality,
          headphoneBox.parentId1,
          headphoneBox.parentId2
        );

      // 신규 Docks 정보 생성
      const createdHeadphoneDockArray =
        this.inventoriesFormula.getHeadphoneDocksFromHeadphoneBox(
          createdHeadphoneFromBox.quality
          // TODO: Mint 및 headphone parent가 완전히 필요없어지면 삭제 필요
          // headphoneDocks1Parent,
          // headphoneDocks2Parent
        );

      let createdHeadphone: Headphone;

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // create item
          // TODO: imgURL 동적으로 입력 받거나 생성 필요
          const newItem = this.itemRepository.create({
            user: userId,
            imgUrl: `https://prod-tracks.s3.amazonaws.com/NFT-images/headphones/default-headphone-small.png`,
            itemStatus: ItemStatus.COOLDOWN,
            type: ItemType.HEADPHONE,
          });

          const item = await manager.save(newItem);

          // create headphone
          // stat 및 quality, cooldownTime 확률에 맞춰 생성
          const newHeadphone = this.headphoneRepository.create({
            ...createdHeadphoneFromBox,
            item: item.id,
            cooldownTime: LocalDateTime.now().plusHours(
              Number(process.env.HEADPHONE_COOLDOWN_TIME_HOUR)
            ),
          });

          createdHeadphone = await manager.save(newHeadphone);

          // create 4 headphone docks
          // attribute를 확률에 맞춰 생성
          for (let i = 1; i < 5; i++) {
            const newHeadphoneDock = this.headphoneDockRepository.create({
              headphone: item.id,
              position: i,
              // i는 position 기준으로, array에서는 i-1로 접근
              attribute: createdHeadphoneDockArray[i - 1].dockAttribute,
              quality: createdHeadphoneDockArray[i - 1].dockQuality,
              dockStatus: DockStatus.NOT_OPENED,
            });

            await manager.save(newHeadphoneDock);
          }

          // HeadphoneBox status update to OPENED
          const updateHeadphoneBoxItem = this.itemRepository.create({
            id: itemInfo.id,
            itemStatus: ItemStatus.OPENED,
            updatedAt: LocalDateTime.now(),
          });
          await manager.save(updateHeadphoneBoxItem);
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        createdHeadphone.item as number,
        userId,
        false
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `openHeadphoneBox(${openHeadphoneBoxDto.headphoneBoxId}, ${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  /**
   * @deprecated
   */
  // async boostOpenHeadphoneBox(
  //   openHeadphoneBoxDto: OpenHeadphoneBoxDto,
  //   userId: number
  // ) {
  //   try {
  //     const headphoneBox = await this.headphoneBoxRepository
  //       .createQueryBuilder('headphoneBox')
  //       .leftJoinAndSelect('headphoneBox.item', 'items')
  //       .where('items.id = :itemId', {
  //         itemId: openHeadphoneBoxDto.headphoneBoxId,
  //       })
  //       .andWhere('items.user = :userId', { userId: userId })
  //       .getOne();

  //     if (!headphoneBox) {
  //       throw new NotFoundException('HeadphoneBox Not found');
  //     }

  //     const itemInfo = headphoneBox.item as Item;
  //     this.policiesService.updateItemStatus(itemInfo).toOpened();

  //     // headphonebox boosting 오픈 시 필요한 밸런스 체크
  //     const userSpendingBalances: UserSpendingBalanceDto[] =
  //       await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

  //     // headphonebox boosting 오픈 시 필요한 비용 계산
  //     const boostOpenHeadphoneBoxCosts =
  //       this.inventoriesFormula.calculateHeadphoneBoxBoostOpenCost(
  //         headphoneBox.quality
  //         // headphoneBox.openingTime
  //       );

  //     const itemInfoForBalanceCheck = {
  //       type: itemInfo.type,
  //       items: headphoneBox,
  //       purpose: BalanceCheckPurpose.BOOST,
  //       requiredCosts: boostOpenHeadphoneBoxCosts,
  //     };

  //     const checkBalance = this.balanceHelper.checkBalance(
  //       userSpendingBalances,
  //       itemInfoForBalanceCheck
  //     );
  //     if (!checkBalance) {
  //       throw new BadRequestException('Not enough balance');
  //     }

  //     const createdHeadphoneFromBox =
  //       this.inventoriesFormula.calculateHeadphoneStatsAndQualityByHeadphoneBox(
  //         headphoneBox.quality,
  //         headphoneBox.parentId1,
  //         headphoneBox.parentId2
  //       );

  //     let createdHeadphone: Headphone;

  //     await this.dataSource
  //       .createEntityManager()
  //       .transaction(async (manager) => {
  //         //  refactoring 대상
  //         // Token 별 소요 비용 차감
  //         for (const levelUpCost of boostOpenHeadphoneBoxCosts.costs) {
  //           userSpendingBalances.map((userSpendingBalance) => {
  //             if (userSpendingBalance.tokenSymbol === levelUpCost.tokenSymbol) {
  //               //  spending wallet/withdraws에서는 모두 string으로 금액이 저장돼 있음. 검토 필요
  //               const balance = (
  //                 Number(userSpendingBalance.balance) - levelUpCost.requiredCost
  //               ).toString();
  //               const availableBalance = (
  //                 Number(userSpendingBalance.availableBalance) -
  //                 levelUpCost.requiredCost
  //               ).toString();

  //               const updateSpendingBalance =
  //                 this.spendingBalanceRepository.create({
  //                   balance,
  //                   availableBalance,
  //                 });
  //               return manager.update(
  //                 SpendingBalance,
  //                 userSpendingBalance.id,
  //                 updateSpendingBalance
  //               );
  //             }
  //           });
  //         }
  //         // create item
  //         // imgURL 동적으로 입력 받거나 생성 필요
  //         const newItem = this.itemRepository.create({
  //           user: userId,
  //           imgUrl: `https://i.imgur.com/XqQXQ.png`,
  //           itemStatus: ItemStatus.COOLDOWN,
  //           type: ItemType.HEADPHONE,
  //         });

  //         const item = await manager.save(newItem);

  //         // create headphone
  //         // stat 및 quality, cooldownTime 확률에 맞춰 생성
  //         const newHeadphone = this.headphoneRepository.create({
  //           ...createdHeadphoneFromBox,
  //           item: item.id,
  //           cooldownTime: LocalDateTime.now().plusHours(1),
  //         });

  //         createdHeadphone = await manager.save(newHeadphone);

  //         // create 4 headphone docks
  //         //  attribute 확률에 맞춰 생성
  //         for (let i = 1; i < 5; i++) {
  //           const newHeadphoneDock = this.headphoneDockRepository.create({
  //             headphone: item.id,
  //             position: i,
  //             attribute: Attribute.EFFICIENCY,
  //             dockStatus: DockStatus.NOT_OPENED,
  //           });

  //           await manager.save(newHeadphoneDock);
  //         }

  //         // HeadphoneBox status update to OPENED
  //         const updateHeadphoneBoxItem = this.itemRepository.create({
  //           id: itemInfo.id,
  //           itemStatus: ItemStatus.OPENED,
  //           updatedAt: LocalDateTime.now(),
  //         });
  //         await manager.save(updateHeadphoneBoxItem);
  //       });

  //     const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
  //       createdHeadphone.item as number,
  //       userId,
  //       true
  //     );

  //     return result;
  //   } catch (error) {
  //     this.logger.error(
  //       error,
  //       `openHeadphoneBox(${openHeadphoneBoxDto.headphoneBoxId}, ${userId})`,
  //       'InventoriesService'
  //     );
  //     exceptionHandler(error);
  //   }
  // }

  async retrieveAllHeadphoneBoxesByUserId(
    userId: number,
    pageOptionsDto: PageOptionsDto
  ) {
    try {
      const queryBuilder = this.headphoneBoxRepository
        .createQueryBuilder('headphoneBox')
        .leftJoinAndSelect('headphoneBox.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.user = :userId', { userId: userId })
        .andWhere('items.itemStatus IN (:itemStatuses)', {
          itemStatuses: [ItemStatus.NOT_OPENED, ItemStatus.SELLING],
        });

      queryBuilder
        .orderBy('items.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      this.logger.error(
        error,
        `retrieveAllHeadphoneBoxesByUserId(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveHeadphoneBoxDetailByItemId(itemId: number) {
    try {
      const result = await this.headphoneBoxRepository
        .createQueryBuilder('headphoneBox')
        .leftJoinAndSelect('headphoneBox.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.id = :itemId', { itemId: itemId })
        .andWhere('items.itemStatus IN (:itemStatuses)', {
          itemStatuses: [ItemStatus.NOT_OPENED, ItemStatus.SELLING],
        })
        .getOne();

      if (!result) {
        throw new NotFoundException('HeadphoneBox Not found');
      }

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveHeadphoneBoxDetailByUserIdAndItemId(${itemId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  /**
   * @deprecated
   */
  async getCalculatedBoostingHeadphoneBoxOpenCost(
    headphoneBoxId: number,
    userId: number
  ) {
    try {
      const headphoneBox = await this.headphoneBoxRepository
        .createQueryBuilder('headphoneBox')
        .leftJoinAndSelect('headphoneBox.item', 'items')
        .where('items.id = :itemId', { itemId: headphoneBoxId })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!headphoneBox) {
        throw new NotFoundException('HeadphoneBox Not found');
      }

      const itemInfo = headphoneBox.item as Item;
      this.policiesService.updateItemStatus(itemInfo).toOpened();

      // headphoneBox boost open cost
      const headphoneBoxBoostOpenCost =
        this.inventoriesFormula.calculateHeadphoneBoxBoostOpenCost(
          headphoneBox.quality
          // headphoneBox.openingTime
        );
      return headphoneBoxBoostOpenCost;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedBoostingHeadphoneBoxOpenCost(${headphoneBoxId}, ${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async updateHeadphoneBox(updateHeadphoneBoxDto: UpdateHeadphoneBoxDto) {
    const item = await this.itemRepository.findOneBy({
      id: updateHeadphoneBoxDto.id,
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const headphoneBox = await this.headphoneBoxRepository.findOneBy({
      item: updateHeadphoneBoxDto.id,
    });
    if (!headphoneBox) {
      throw new NotFoundException('HeadphoneBox not found');
    }

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          if (updateHeadphoneBoxDto.item) {
            const updateItem = this.itemRepository.create(
              updateHeadphoneBoxDto.item
            );
            await manager.update(Item, updateHeadphoneBoxDto.id, updateItem);
          }

          if (updateHeadphoneBoxDto.headphoneBox) {
            const updateHeadphoneBox = this.headphoneBoxRepository.create(
              updateHeadphoneBoxDto.headphoneBox
            );
            await manager.update(
              HeadphoneBox,
              updateHeadphoneBoxDto.id,
              updateHeadphoneBox
            );
          }
        });

      return { result: 'Success to update HeadphoneBox' };
    } catch (error) {
      this.logger.error(
        error,
        `updateHeadphoneBox(${updateHeadphoneBoxDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async deleteHeadphoneBox(headphoneBoxId: number) {
    const item = await this.itemRepository.findOneBy({ id: headphoneBoxId });
    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    const headphoneBox = await this.headphoneBoxRepository.findOneBy({
      item: headphoneBoxId,
    });
    if (!headphoneBox) {
      throw new HttpException('HeadphoneBox not found', HttpStatus.NOT_FOUND);
    }

    try {
      // headphoneBox, item 삭제
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          await manager.remove(headphoneBox);
          await manager.remove(item);
        });

      return { result: 'Success to delete HeadphoneBox' };
    } catch (error) {
      this.logger.error(
        error,
        `deleteHeadphoneBox(${headphoneBoxId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }
}
