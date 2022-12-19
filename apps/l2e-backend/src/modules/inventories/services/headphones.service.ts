import {
  HeadphoneBoxRepository,
  HeadphoneDockRepository,
  HeadphoneRepository,
  ItemRepository,
  MysteryBoxRepository,
  PinballheadRepository,
  SpendingBalanceRepository,
  StickerRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
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
  User,
} from '@libs/l2e-queries/entities';
import {
  Attribute,
  ItemType,
  Quality,
  CreateHeadphoneDto,
  UpdateHeadphoneDto,
  ItemStatus,
  DockStatus,
  LevelUpHeadphoneDto,
  UserSpendingBalanceDto,
  HeadphoneLevelUpCostsAndTimeDto,
  BoostLevelUpHeadphoneDto,
  HeadphoneLevelUpStats,
  StatUpHeadphoneDto,
  MintHeadphoneDto,
  MountHeadphoneDto,
  CooldownCompleteHeadphoneDto,
  ChargeHeadphoneRequestDto,
  HeadphoneDto,
  RequiredCosts,
  OpenHeadphoneDockDto,
  reduceHeadphoneBatteryDto,
} from '@libs/l2e-queries/dtos';
import { INVENTORIES_CONFIG_OPTIONS } from '../inventories.constant';
import { InventoriesModuleOptions } from '../inventories.interface';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import { DataSource, EntityManager } from 'typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { LocalDateTime } from '@js-joda/core';
import { HeadphoneBoxesService } from './headphone-boxes.service';
import { PoliciesService } from '@src/modules/policies/policies.service';
import { SpendingBalancesService } from '@src/modules/spending-balances/spending-balances.service';
import { convertNumberWithDecimalFloor } from '@libs/l2e-utils/util-functions';
import { InventoriesFormulaService } from '../inventories-formula.service';
import { InventoriesUtilService } from '../inventories-util.service';
import { TIME_REWARD_TOKEN } from '@libs/l2e-utils/constants';
import { EnergiesService } from '@src/modules/energies/energies.service';

@Injectable()
export class HeadphonesService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(INVENTORIES_CONFIG_OPTIONS)
    private readonly options: InventoriesModuleOptions,
    @Inject(InventoriesFormulaService)
    private readonly inventoriesFormula: InventoriesFormulaService,
    @Inject(InventoriesUtilService)
    private readonly inventoriesUtil: InventoriesUtilService,
    // @Inject(BalanceHelperForHeadphone)
    // private readonly balanceHelper: BalanceHelperForHeadphone,
    @Inject(HeadphoneBoxesService)
    private readonly headphoneBoxesService: HeadphoneBoxesService,
    @Inject(SpendingBalancesService)
    private readonly spendingBalancesService: SpendingBalancesService,
    @Inject(EnergiesService)
    private readonly energyService: EnergiesService,
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
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @Inject(PoliciesService)
    private readonly policiesService: PoliciesService,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  /**
   * @deprecated
   */
  async createHeadphone(createHeadphoneDto: CreateHeadphoneDto) {
    let createdHeadphone: Headphone;

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // create item
          //  imgURL 동적으로 입력 받거나 생성 필요
          const newItem = this.itemRepository.create({
            user: createHeadphoneDto.userId,
            imgUrl: `https://prod-tracks.s3.amazonaws.com/NFT-images/headphones/default-headphone-small.png`,
            itemStatus: ItemStatus.LISTENING,
            type: ItemType.HEADPHONE,
          });

          const item = await manager.save(newItem);

          // create headphone
          //  stat 및 quality, cooldownTime 확률에 맞춰 생성
          const newHeadphone = this.headphoneRepository.create({
            item: item.id,
            baseLuck: 1,
            luck: 1,
            baseComfort: 1,
            comfort: 1,
            baseEfficiency: 1,
            efficiency: 1,
            baseResilience: 1,
            resilience: 1,
            quality: Quality.COMMON,
            cooldownTime: LocalDateTime.now().plusHours(24),
          });

          createdHeadphone = await manager.save(newHeadphone);

          // create 4 headphone docks
          //  attribute 확률에 맞춰 생성
          for (let i = 1; i < 5; i++) {
            const newHeadphoneDock = this.headphoneDockRepository.create({
              headphone: item.id,
              position: i,
              attribute: Attribute.EFFICIENCY,
              dockStatus: DockStatus.NOT_OPENED,
            });

            await manager.save(newHeadphoneDock);
          }
        });

      return createdHeadphone;
    } catch (error) {
      this.logger.error(
        error,
        `createHeadphone(${createHeadphoneDto.userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async mintHeadphone(mintHeadphoneDto: MintHeadphoneDto, userId: number) {
    try {
      const mintHeadphone1Dto: HeadphoneDto = {
        headphoneId: mintHeadphoneDto.headphoneIds[0],
      };

      const headphone1Info = await this.retrieveHeadphoneWithUserId(
        mintHeadphone1Dto,
        userId
      );

      const mintHeadphone2Dto: HeadphoneDto = {
        headphoneId: mintHeadphoneDto.headphoneIds[1],
      };

      const headphone2Info = await this.retrieveHeadphoneWithUserId(
        mintHeadphone2Dto,
        userId
      );

      this.checkMintCondition(headphone1Info, headphone2Info);

      const newCreateHeadphoneBox =
        this.inventoriesFormula.GenerateNewHeadphoneBoxByMinting(
          headphone1Info.headphone,
          headphone2Info.headphone
        );

      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      const mintingCosts: RequiredCosts =
        this.inventoriesFormula.calculateMintingCosts(
          headphone1Info.headphone,
          headphone2Info.headphone
        );

      // const itemInfoForBalanceCheck = {
      //   type: headphone1Info.itemInfo.type,
      //   purpose: BalanceCheckPurpose.MINT,
      //   items: [headphone1Info.headphone, headphone2Info.headphone],
      //   requiredCosts: mintingCosts,
      // };
      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      let newHeadphoneBox: HeadphoneBox;
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const boostLevelUpCost of mintingCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              boostLevelUpCost,
              manager
            );
          }

          // TODO: imgURL 동적으로 입력 받거나 생성 필요
          const newItemEntity = this.itemRepository.create({
            user: userId,
            imgUrl: `https://i.imgur.com/XqQXQ.png`,
            itemStatus: ItemStatus.NOT_OPENED,
            type: ItemType.HEADPHONEBOX,
          });

          const newItem = await manager.save(newItemEntity);

          // create headphoneBox
          const newHeadphoneBoxEntity = this.headphoneBoxRepository.create({
            item: newItem.id,
            ...newCreateHeadphoneBox,
          });

          newHeadphoneBox = await manager.save(newHeadphoneBoxEntity);

          // headphone mint count 추가
          const updateHeadphone1 = this.headphoneRepository.create({
            mintCount: headphone1Info.headphone.mintCount + 1,
          });

          const updateHeadphoneItem1 = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
            id: (headphone1Info.itemInfo as Item).id,
          });

          await this.updateHeadphone(
            updateHeadphone1,
            updateHeadphoneItem1,
            manager
          );

          const updateHeadphone2 = this.headphoneRepository.create({
            mintCount: headphone2Info.headphone.mintCount + 1,
          });

          const updateHeadphoneItem2 = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
            id: (headphone2Info.itemInfo as Item).id,
          });

          await this.updateHeadphone(
            updateHeadphone2,
            updateHeadphoneItem2,
            manager
          );
        });

      const result = this.inventoriesUtil.retrieveUpdatedHeadphoneBoxData(
        newHeadphoneBox.item as number,
        userId,
        true
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `mintHeadphone(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  private checkMintCondition(
    headphone1Info: { itemInfo: Item; headphone: Headphone },
    headphone2Info: { itemInfo: Item; headphone: Headphone }
  ) {
    if (
      headphone1Info.itemInfo.itemStatus === ItemStatus.COOLDOWN ||
      headphone1Info.itemInfo.itemStatus === ItemStatus.SELLING ||
      headphone1Info.itemInfo.itemStatus === ItemStatus.LISTENING ||
      headphone2Info.itemInfo.itemStatus === ItemStatus.COOLDOWN ||
      headphone2Info.itemInfo.itemStatus === ItemStatus.SELLING ||
      headphone2Info.itemInfo.itemStatus === ItemStatus.LISTENING
    ) {
      throw new BadRequestException(
        'Can not mint headphone with current status'
      );
    }

    if (
      headphone1Info.headphone.availableMintCount <=
        headphone1Info.headphone.mintCount ||
      headphone2Info.headphone.availableMintCount <=
        headphone2Info.headphone.mintCount
    ) {
      throw new BadRequestException(
        'Can not mint headphone with no available mint count'
      );
    }

    if (
      headphone1Info.headphone.level < 5 ||
      headphone2Info.headphone.level < 5
    ) {
      throw new BadRequestException('Can not mint headphone with level < 5');
    }
  }

  async retrieveAllHeadphonesByUserId(
    userId: number,
    pageOptionsDto: PageOptionsDto
  ) {
    try {
      const queryBuilder = this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.user = :userId', { userId: userId })
        .andWhere('items.itemStatus IN (:itemStatuses)', {
          itemStatuses: [
            ItemStatus.IDLE,
            ItemStatus.COOLDOWN,
            ItemStatus.LISTENING,
            ItemStatus.LEVELING,
            ItemStatus.SELLING,
          ],
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
        `retrieveAllHeadphonesByUserId(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveHeadphoneDetailByItemId(itemId: number) {
    try {
      const headphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.id = :itemId', { itemId: itemId })
        .andWhere('items.itemStatus IN (:itemStatuses)', {
          itemStatuses: [
            ItemStatus.IDLE,
            ItemStatus.COOLDOWN,
            ItemStatus.LISTENING,
            ItemStatus.LEVELING,
            ItemStatus.SELLING,
          ],
        })
        .getOne();

      if (!headphone) {
        throw new NotFoundException('Headphone not found');
      }

      const headphoneDocks = await this.headphoneDockRepository
        .createQueryBuilder('headphoneDock')
        .leftJoinAndSelect('headphoneDock.sticker', 'sticker')
        .leftJoinAndSelect('sticker.stickerDetail', 'stickerDetail')
        .where('headphoneDock.headphone = :headphoneId', {
          headphoneId: itemId,
        })
        .getMany();

      if (!headphoneDocks) {
        throw new NotFoundException('Headphone Dock not found');
      }

      headphoneDocks.forEach((headphoneDock) => {
        delete headphoneDock.headphone;
        delete headphoneDock.id;
      });

      const result = {
        ...headphone,
        headphoneDocks,
      };

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveHeadphoneDetailByUserIdAndItemId(${itemId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveListeningHeadphoneDetail(userId: number) {
    try {
      const headphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.user = :userId', { userId: userId })
        .andWhere('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.LISTENING,
        })
        .getOne();

      if (!headphone) {
        throw new NotFoundException('Headphone not found');
      }

      const headphoneDocks = await this.headphoneDockRepository
        .createQueryBuilder('headphoneDock')
        .leftJoinAndSelect('headphoneDock.sticker', 'sticker')
        .leftJoinAndSelect('sticker.stickerDetail', 'stickerDetail')
        .where('headphoneDock.headphone = :headphoneId', {
          headphoneId: (headphone.item as Item).id,
        })
        .getMany();

      if (!headphoneDocks) {
        throw new NotFoundException('Headphone Dock not found');
      }

      headphoneDocks.forEach((headphoneDock) => {
        delete headphoneDock.headphone;
        delete headphoneDock.id;
      });

      const result = {
        ...headphone,
        headphoneDocks,
      };

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveListeningHeadphoneDetail(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedLevelUpCostHeadphone(
    levelUpHeadphoneId: number,
    userId: number
  ) {
    try {
      const levelUpHeadphoneDto: LevelUpHeadphoneDto = {
        headphoneId: levelUpHeadphoneId,
      };
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        levelUpHeadphoneDto,
        userId
      );

      // check if other headphone is leveling up
      const levelingUpHeadphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.LEVELING,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();
      if (levelingUpHeadphone) {
        throw new BadRequestException('Other headphone is leveling up');
      }

      this.policiesService.updateItemStatus(itemInfo).toLeveling();

      const result = this.inventoriesFormula.calculateLevelUpCostAndTime(
        headphone.level,
        headphone.quality
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedLevelUpCostHeadphone(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedBoostingLevelUpCostHeadphone(
    boostLevelUpHeadphoneId: number,
    userId: number
  ) {
    try {
      const boostLevelUpHeadphoneDto: BoostLevelUpHeadphoneDto = {
        headphoneId: boostLevelUpHeadphoneId,
      };

      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        boostLevelUpHeadphoneDto,
        userId
      );

      if (itemInfo.itemStatus !== ItemStatus.LEVELING) {
        throw new BadRequestException('Headphone can not boost level up');
      }

      const result = this.inventoriesFormula.calculateBoostLevelUpCosts(
        headphone.level,
        headphone.quality,
        headphone.levelUpCompletionTime
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedLevelUpCostHeadphone(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedChargingCostHeadphone(
    chargeHeadphoneRequestDto: ChargeHeadphoneRequestDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        chargeHeadphoneRequestDto,
        userId
      );

      // constraint for charging
      if (itemInfo.itemStatus !== ItemStatus.IDLE) {
        throw new BadRequestException('Headphone can not charge');
      }
      if (headphone.battery === 100) {
        throw new BadRequestException('Headphone is fully charged');
      }

      const fullChargingAmount = 100 - headphone.battery;
      const result = this.inventoriesFormula.calculateChargingCosts(
        fullChargingAmount,
        headphone.quality,
        headphone.level
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedChargingCostHeadphone(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedMintingCostHeadphone(
    mintHeadphoneId1: number,
    mintHeadphoneId2: number,
    userId: number
  ) {
    try {
      const mintHeadphone1Dto: HeadphoneDto = {
        headphoneId: mintHeadphoneId1,
      };

      const headphone1Info = await this.retrieveHeadphoneWithUserId(
        mintHeadphone1Dto,
        userId
      );

      const mintHeadphone2Dto: HeadphoneDto = {
        headphoneId: mintHeadphoneId2,
      };

      const headphone2Info = await this.retrieveHeadphoneWithUserId(
        mintHeadphone2Dto,
        userId
      );

      this.checkMintCondition(headphone1Info, headphone2Info);

      const result = this.inventoriesFormula.calculateMintingCosts(
        headphone1Info.headphone,
        headphone2Info.headphone
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedMintingCostHeadphone(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedOpenDockCostHeadphone(
    openDockHeadphoneId: number,
    dockPosition: number,
    userId: number
  ) {
    try {
      const openHeadphoneDockDto: OpenHeadphoneDockDto = {
        headphoneId: openDockHeadphoneId,
        position: dockPosition,
      };
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        openHeadphoneDockDto,
        userId
      );

      // check limitations for opening dock
      this.checkOpenDockCondition(headphone.level, dockPosition);

      const headphoneDocks = await this.headphoneDockRepository
        .createQueryBuilder('headphone_dock')
        .leftJoinAndSelect('headphone_dock.headphone', 'items')
        .where('items.id = :itemId', {
          itemId: openHeadphoneDockDto.headphoneId,
        })
        .andWhere('headphone_dock.dockStatus = :status', {
          status: DockStatus.NOT_OPENED,
        })
        .andWhere('headphone_dock.position = :position', {
          position: openHeadphoneDockDto.position,
        })
        .getOne();

      if (!headphoneDocks) {
        throw new NotFoundException('Headphone Dock not found');
      }

      const openDockCosts = this.inventoriesFormula.calculateOpenDockCosts(
        dockPosition,
        headphone.quality
      );

      return openDockCosts;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedOpenDockCostHeadphone(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async updateHeadphoneByAdmin(updateHeadphoneDto: UpdateHeadphoneDto) {
    const item = await this.itemRepository.findOneBy({
      id: updateHeadphoneDto.id,
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const headphone = await this.headphoneRepository.findOneBy({
      item: updateHeadphoneDto.id,
    });
    if (!headphone) {
      throw new NotFoundException('Headphone not found');
    }

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          if (updateHeadphoneDto.item) {
            const updateItem = this.itemRepository.create(
              updateHeadphoneDto.item
            );
            await manager.update(Item, updateHeadphoneDto.id, updateItem);
          }

          if (updateHeadphoneDto.headphone) {
            const updateHeadphone = this.headphoneRepository.create(
              updateHeadphoneDto.headphone
            );
            await manager.update(
              Headphone,
              updateHeadphoneDto.id,
              updateHeadphone
            );
          }
        });

      return { result: 'Success to update Headphone' };
    } catch (error) {
      this.logger.error(
        error,
        `updateHeadphone(${updateHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  private async updateHeadphone(
    headphoneEntity: Headphone,
    itemEntity: Item,
    manager: EntityManager
  ) {
    await manager.update(Headphone, itemEntity.id, headphoneEntity);
    await manager.update(Item, itemEntity.id, itemEntity);
  }

  async levelUpHeadphone(
    levelUpHeadphoneDto: LevelUpHeadphoneDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        levelUpHeadphoneDto,
        userId
      );

      // check if other headphone is leveling up
      const levelingUpHeadphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.LEVELING,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();
      if (levelingUpHeadphone) {
        throw new BadRequestException('Other headphone is leveling up');
      }

      this.policiesService.updateItemStatus(itemInfo).toLeveling();

      const userSpendingBalances: UserSpendingBalanceDto[] =
        // await this.balanceHelper.getBalances(userId);
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);
      if (!userSpendingBalances) {
        throw new NotFoundException('User spending balance not found');
      }

      // 레벨업에 필요한 비용 / 시간 계산
      const levelUpCostsAndTime: HeadphoneLevelUpCostsAndTimeDto =
        this.inventoriesFormula.calculateLevelUpCostAndTime(
          headphone.level,
          headphone.quality
        );

      // const itemInfoForBalanceCheck = {
      //   type: itemInfo.type,
      //   purpose: BalanceCheckPurpose.LEVELUP,
      //   items: headphone,
      //   requiredCosts: levelUpCostsAndTime.costs,
      // };
      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const levelUpCost of levelUpCostsAndTime.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              levelUpCost,
              manager
            );
          }

          // item 상태 변경 to LEVELING
          const updateItemEntity = this.itemRepository.create({
            itemStatus: ItemStatus.LEVELING,
            id: itemInfo.id,
          });

          // 레벨업 소요 시간 설정
          const updateHeadphoneEntity = this.headphoneRepository.create({
            levelUpCompletionTime: levelUpCostsAndTime.levelUpCompletionTime,
          });

          await this.updateHeadphone(
            updateHeadphoneEntity,
            updateItemEntity,
            manager
          );
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        levelUpHeadphoneDto.headphoneId,
        userId,
        true
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `levelUpHeadphone(${levelUpHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async boostLevelUpHeadphone(
    boostLevelUpHeadphoneDto: BoostLevelUpHeadphoneDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        boostLevelUpHeadphoneDto,
        userId
      );

      if (itemInfo.itemStatus !== ItemStatus.LEVELING) {
        throw new BadRequestException('Headphone can not boost level up');
      }

      this.policiesService.updateItemStatus(itemInfo).toIdle();

      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      // 레벨업에 필요한 비용 / 시간 계산
      const boostLevelUpCosts: RequiredCosts =
        this.inventoriesFormula.calculateBoostLevelUpCosts(
          headphone.level,
          headphone.quality,
          headphone.levelUpCompletionTime
        );

      // const itemInfoForBalanceCheck = {
      //   type: itemInfo.type,
      //   purpose: BalanceCheckPurpose.BOOST,
      //   items: headphone,
      //   requiredCosts: boostLevelUpCosts,
      // };
      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      // 레벨 업 후 추가 될 stat 개수 계산
      const levelUpStats: HeadphoneLevelUpStats =
        this.inventoriesFormula.calculateLevelUpStats(headphone.quality);

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const boostLevelUpCost of boostLevelUpCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              boostLevelUpCost,
              manager
            );
          }

          // levelUpCompletionTime / level / remainedStat 업데이트
          const updateHeadphone = this.headphoneRepository.create({
            levelUpCompletionTime: null,
            level: headphone.level + 1,
            remainedStat:
              headphone.remainedStat + levelUpStats.levelUpStatCount,
          });

          // item 상태 변경 to IDLE
          const updateItem = this.itemRepository.create({
            itemStatus: ItemStatus.IDLE,
            id: itemInfo.id,
          });

          await this.updateHeadphone(updateHeadphone, updateItem, manager);
        });

      // TODO: 별개 트랜잭션으로 나눠져있음. 방법을 찾아 동일한 트랜잭션으로 묶어야 함
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // 레벨 업 후 보유한 헤드폰 중 가장 높은 레벨 맞춰 dailyTokenEarningLimit 계산
          await this.inventoriesUtil.updateDailyTokenEarningLimitByHeadphoneInfo(
            userId,
            manager
          );
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        boostLevelUpHeadphoneDto.headphoneId,
        userId,
        true
      );
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `boostLevelUpHeadphone(${boostLevelUpHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async completeLevelUpHeadphone(
    levelUpHeadphoneDto: LevelUpHeadphoneDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        levelUpHeadphoneDto,
        userId
      );
      this.policiesService.updateItemStatus(itemInfo).toIdle();

      if (headphone.levelUpCompletionTime.isAfter(LocalDateTime.now())) {
        throw new BadRequestException('Headphone can not complete to level up');
      }

      // 레벨 업 후 추가 될 stat 개수 계산
      const levelUpStats: HeadphoneLevelUpStats =
        this.inventoriesFormula.calculateLevelUpStats(headphone.quality);

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // levelUpCompletionTime / level / remainedStat 업데이트
          const updateHeadphone = this.headphoneRepository.create({
            levelUpCompletionTime: null,
            level: headphone.level + 1,
            remainedStat:
              headphone.remainedStat + levelUpStats.levelUpStatCount,
          });

          // item 상태 변경 to IDLE
          const updateItem = this.itemRepository.create({
            itemStatus: ItemStatus.IDLE,
            id: levelUpHeadphoneDto.headphoneId,
          });

          await this.updateHeadphone(updateHeadphone, updateItem, manager);
        });

      // TODO: 별개 트랜잭션으로 나눠져있음. 방법을 찾아 동일한 트랜잭션으로 묶어야 함
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // 레벨 업 후 보유한 헤드폰 중 가장 높은 레벨 맞춰 dailyTokenEarningLimit 계산
          await this.inventoriesUtil.updateDailyTokenEarningLimitByHeadphoneInfo(
            userId,
            manager
          );
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        levelUpHeadphoneDto.headphoneId,
        userId,
        false
      );
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `completeLevelUpHeadphone(${levelUpHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async completeCooldownHeadphone(
    cooldownCompleteHeadphoneDto: CooldownCompleteHeadphoneDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        cooldownCompleteHeadphoneDto,
        userId
      );
      this.policiesService.updateItemStatus(itemInfo).toIdle();

      if (headphone.cooldownTime.isAfter(LocalDateTime.now())) {
        throw new BadRequestException('Headphone can not complete to cooldown');
      }

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // levelUpCompletionTime / level / remainedStat 업데이트
          const updateHeadphone = this.headphoneRepository.create({
            cooldownTime: null,
          });
          // item 상태 변경 to IDLE
          const updateItem = this.itemRepository.create({
            itemStatus: ItemStatus.IDLE,
            id: cooldownCompleteHeadphoneDto.headphoneId,
          });
          await this.updateHeadphone(updateHeadphone, updateItem, manager);
        });

      // TODO: 별개 트랜잭션으로 나눠져있음. 방법을 찾아 동일한 트랜잭션으로 묶어야 함
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Cooldown 완료 후 보유한 헤드폰 중 가장 높은 레벨에 맞춰 dailyTokenEarningLimit 계산
          await this.inventoriesUtil.updateDailyTokenEarningLimitByHeadphoneInfo(
            userId,
            manager
          );
        });
      // TODO: transaction 처리 필요
      await this.energyService.updateEnergyCap(userId);

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        cooldownCompleteHeadphoneDto.headphoneId,
        userId,
        false
      );
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `completeCooldownHeadphone(${cooldownCompleteHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async statUpHeadphone(
    statUpHeadphoneDto: StatUpHeadphoneDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        statUpHeadphoneDto,
        userId
      );

      // TODO: 리팩토링 대상, nullish로 체크하는건 너무 김. 다른 방법 고민 필요
      statUpHeadphoneDto.efficiency = statUpHeadphoneDto.efficiency ?? 0;
      statUpHeadphoneDto.comfort = statUpHeadphoneDto.comfort ?? 0;
      statUpHeadphoneDto.resilience = statUpHeadphoneDto.resilience ?? 0;
      statUpHeadphoneDto.luck = statUpHeadphoneDto.luck ?? 0;
      const totalStatUpPoints =
        statUpHeadphoneDto.comfort +
        statUpHeadphoneDto.efficiency +
        statUpHeadphoneDto.luck +
        statUpHeadphoneDto.resilience;
      const remainedStatAfterStatUp =
        headphone.remainedStat - totalStatUpPoints;

      if (remainedStatAfterStatUp < 0) {
        throw new BadRequestException('Headphone can not stat up');
      }

      // TODO: 스탯 올릴 수 있는 상태 확인
      if (itemInfo.itemStatus !== ItemStatus.IDLE) {
        throw new BadRequestException('Headphone can not stat up');
      }

      const levelLuck = headphone.levelLuck + statUpHeadphoneDto.luck;
      const luck = headphone.luck + statUpHeadphoneDto.luck;
      const levelResilience =
        headphone.levelResilience + statUpHeadphoneDto.resilience;
      const resilience = headphone.resilience + statUpHeadphoneDto.resilience;
      const levelComfort = headphone.levelComfort + statUpHeadphoneDto.comfort;
      const comfort = headphone.comfort + statUpHeadphoneDto.comfort;
      const levelEfficiency =
        headphone.levelEfficiency + statUpHeadphoneDto.efficiency;
      const efficiency = headphone.efficiency + statUpHeadphoneDto.efficiency;

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          const updateHeadphone = this.headphoneRepository.create({
            levelLuck,
            luck,
            levelResilience,
            resilience,
            levelComfort,
            comfort,
            levelEfficiency,
            efficiency,
            remainedStat: remainedStatAfterStatUp,
          });

          const updateItem = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
            id: statUpHeadphoneDto.headphoneId,
          });

          await this.updateHeadphone(updateHeadphone, updateItem, manager);
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        statUpHeadphoneDto.headphoneId,
        userId,
        false
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `statUpHeadphone(${statUpHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async mountHeadphone(mountHeadphoneDto: MountHeadphoneDto, userId: number) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        mountHeadphoneDto,
        userId
      );

      this.policiesService.updateItemStatus(itemInfo).toListening();

      const mountedHeadphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.LISTENING,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // 기존에 mounted 상태인 headphone이 있으면 unmount 처리
          if (mountedHeadphone) {
            const updateItem = this.itemRepository.create({
              itemStatus: ItemStatus.IDLE,
            });
            await manager.update(
              Item,
              (mountedHeadphone.item as Item).id,
              updateItem
            );
          }

          // headphone 상태 변경 to LISTENING
          const updateItem = this.itemRepository.create({
            itemStatus: ItemStatus.LISTENING,
          });

          await manager.update(Item, itemInfo.id, updateItem);
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        mountHeadphoneDto.headphoneId,
        userId,
        false
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `mountHeadphone(${mountHeadphoneDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async chargeHeadphone(
    chargeHeadphoneRequestDto: ChargeHeadphoneRequestDto,
    userId: number
  ) {
    try {
      const { headphoneId, chargingAmount } = chargeHeadphoneRequestDto;
      if (!chargingAmount) {
        throw new BadRequestException('Charging amount is required');
      }

      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        chargeHeadphoneRequestDto,
        userId
      );

      if (chargingAmount > 100 - headphone.battery) {
        throw new BadRequestException('Charging amount is too large');
      }

      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      // charging cost
      const chargingCosts = this.inventoriesFormula.calculateChargingCosts(
        chargingAmount,
        headphone.quality,
        headphone.level
      );

      // const itemInfoForBalanceCheck = {
      //   type: itemInfo.type,
      //   purpose: BalanceCheckPurpose.CHARGING,
      //   items: headphone,
      //   requiredCosts: chargingCosts,
      // };
      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const chargingCost of chargingCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              chargingCost,
              manager
            );
          }

          // chargingAmount charged 처리
          const chargedBattery = headphone.battery + chargingAmount;
          const updateHeadphone = this.headphoneRepository.create({
            battery: chargedBattery,
          });

          const updateItem = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
            id: itemInfo.id,
          });

          await this.updateHeadphone(updateHeadphone, updateItem, manager);
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        headphoneId,
        userId,
        true
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `chargeHeadphone(${chargeHeadphoneRequestDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async reduceHeadphoneBattery(
    reduceHeadphoneDurabilityDto: reduceHeadphoneBatteryDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        reduceHeadphoneDurabilityDto,
        userId
      );

      //attempt to floor playtime to 10^1 * x
      const timeListened =
        convertNumberWithDecimalFloor(
          reduceHeadphoneDurabilityDto.timeListened / TIME_REWARD_TOKEN,
          0
        ) * TIME_REWARD_TOKEN;

      const energyAmountConsumed =
        timeListened * parseFloat(process.env.ENERGY_CONSUMED_PER_SECOND);

      const batteryAmountConsumed =
        (energyAmountConsumed * parseFloat(process.env.BATTERY_REDUCE_CONST)) /
        headphone.resilience;

      //check battery & energy reduce amount legitimate
      if (!energyAmountConsumed) {
        throw new BadRequestException(
          'Energy amount consumed  is required! Either time listened is missing or ENERGY_CONSUMED_PER_SECOND was not initialized'
        );
      }

      if (headphone.battery - batteryAmountConsumed < 0) {
        throw new BadRequestException('Reduce amount is too large');
      }

      //save new battery amount of headphone using transaction
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // question : floor up or down => floor down
          let afterReduceBattery = convertNumberWithDecimalFloor(
            parseFloat((headphone.battery - batteryAmountConsumed).toFixed(1)),
            0
          );
          if (afterReduceBattery < 0) {
            afterReduceBattery = 0;
          }
          const updateHeadphone = this.headphoneRepository.create({
            battery: afterReduceBattery,
          });

          const updateItem = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
            id: itemInfo.id,
          });

          await this.updateHeadphone(updateHeadphone, updateItem, manager);
        });

      //check update status
      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        reduceHeadphoneDurabilityDto.headphoneId,
        userId,
        true
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `chargeHeadphone(${reduceHeadphoneDurabilityDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async openHeadphoneDock(
    openHeadphoneDockDto: OpenHeadphoneDockDto,
    userId: number
  ) {
    try {
      const { itemInfo, headphone } = await this.retrieveHeadphoneWithUserId(
        openHeadphoneDockDto,
        userId
      );

      // check limitations for opening dock
      this.checkOpenDockCondition(
        headphone.level,
        openHeadphoneDockDto.position
      );

      const headphoneDocks = await this.headphoneDockRepository
        .createQueryBuilder('headphone_dock')
        .leftJoinAndSelect('headphone_dock.headphone', 'items')
        .where('items.id = :itemId', {
          itemId: openHeadphoneDockDto.headphoneId,
        })
        .andWhere('headphone_dock.dockStatus = :status', {
          status: DockStatus.NOT_OPENED,
        })
        .andWhere('headphone_dock.position = :position', {
          position: openHeadphoneDockDto.position,
        })
        .getOne();

      if (!headphoneDocks) {
        throw new NotFoundException('Headphone Dock not found');
      }

      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      const openDockCosts = this.inventoriesFormula.calculateOpenDockCosts(
        openHeadphoneDockDto.position,
        headphone.quality
      );

      // const itemInfoForBalanceCheck = {
      //   type: itemInfo.type,
      //   purpose: BalanceCheckPurpose.DOCK_OPEN,
      //   items: headphone,
      //   requiredCosts: openDockCosts,
      // };
      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const chargingCost of openDockCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              chargingCost,
              manager
            );
          }

          // Dock position status 변경 to OPENED
          const updateHeadphoneDock = this.headphoneDockRepository.create({
            position: headphoneDocks.position,
            dockStatus: DockStatus.OPENED,
          });
          await manager.update(
            HeadphoneDock,
            headphoneDocks.id,
            updateHeadphoneDock
          );

          const updateItem = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
          });
          await manager.update(Item, itemInfo.id, updateItem);
        });

      let result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        openHeadphoneDockDto.headphoneId,
        userId,
        false
      );

      result = {
        ...result,
      };

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `openHeadphoneDock(${openHeadphoneDockDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async deleteHeadphone(headphoneId: number) {
    const item = await this.itemRepository.findOneBy({ id: headphoneId });
    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }

    const headphone = await this.headphoneRepository.findOneBy({
      item: headphoneId,
    });
    if (!headphone) {
      throw new HttpException('Headphone not found', HttpStatus.NOT_FOUND);
    }

    const headphoneDocks = await this.headphoneDockRepository.findBy({
      headphone: headphoneId,
    });
    if (!headphoneDocks || headphoneDocks.length === 0) {
      throw new HttpException('Headphone dock not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Sticker가 dock에 삽입된 상태면, 해제해야함
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          for (const headphoneDock of headphoneDocks) {
            if (headphoneDock.sticker !== null) {
              headphoneDock.sticker = null;
              // TODO: headphone을 합성 할때, sticker가 있으면 그대로 같이 삭제 할건지, 남길건지에 따라 수정 필요. 현재는 남김
              await manager.update(HeadphoneDock, headphoneDock.id, {
                dockStatus: DockStatus.NOT_OPENED,
              });
            }
          }
        });
    } catch (error) {
      this.logger.error(
        error,
        `updateStickersInHeadphoneDocks(${headphoneId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }

    try {
      // headphone, headphoneDocks, item 삭제
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          await manager.remove(headphone);
          await manager.remove(headphoneDocks);
          await manager.remove(item);
        });

      return { result: 'Success to delete Headphone' };
    } catch (error) {
      this.logger.error(
        error,
        `deleteHeadphone(${headphoneId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  private async retrieveHeadphoneWithUserId(
    HeadphoneDto:
      | HeadphoneDto
      | LevelUpHeadphoneDto
      | BoostLevelUpHeadphoneDto
      | MountHeadphoneDto
      | ChargeHeadphoneRequestDto
      // | OpenHeadphoneDockDto
      | CooldownCompleteHeadphoneDto,
    userId: number
  ) {
    let headphone: Headphone;
    try {
      headphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: HeadphoneDto.headphoneId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();
    } catch (error) {
      throw new InternalServerErrorException('Headphone error');
    }

    if (!headphone) {
      throw new NotFoundException('Headphone Not found');
    }

    let itemInfo: Item;
    try {
      itemInfo = headphone.item as Item;
    } catch (error) {
      throw new InternalServerErrorException('Item error');
    }
    return { itemInfo, headphone };
  }

  private checkOpenDockCondition(level: number, dockPosition: number) {
    switch (dockPosition) {
      case 1:
        if (level < 5) {
          throw new BadRequestException('Headphone level is not enough');
        }
        break;
      case 2:
        if (level < 10) {
          throw new BadRequestException('Headphone level is not enough');
        }
        break;
      case 3:
        if (level < 15) {
          throw new BadRequestException('Headphone level is not enough');
        }
        break;
      case 4:
        if (level < 20) {
          throw new BadRequestException('Headphone level is not enough');
        }
        break;
      default:
        throw new BadRequestException('Dock position is not valid');
    }
  }
}
