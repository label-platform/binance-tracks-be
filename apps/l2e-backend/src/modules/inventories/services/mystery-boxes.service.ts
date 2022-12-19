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
  BadRequestException,
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
  CreateMysteryBoxDto,
  UpdateMysteryBoxDto,
  ItemStatus,
  OpenMysteryBoxDto,
  UserSpendingBalanceDto,
  BalanceCheckPurpose,
  ItemTypeFromMysteryBox,
  MysteryBoxQuality,
  CostDto,
  TokenSymbol,
  ItemFromMysteryBox,
} from '@libs/l2e-queries/dtos';
import { INVENTORIES_CONFIG_OPTIONS } from '../inventories.constant';
import { InventoriesModuleOptions } from '../inventories.interface';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import { DataSource, EntityManager } from 'typeorm';
import { InventoriesFormulaService } from '../inventories-formula.service';
import { exceptionHandler } from '@src/common/exception-handler';
import { LocalDateTime } from '@js-joda/core';
import { PoliciesService } from '@src/modules/policies/policies.service';
import { InventoriesUtilService } from '../inventories-util.service';
import { SpendingBalancesService } from '@src/modules/spending-balances/spending-balances.service';

@Injectable()
export class MysteryBoxesService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(INVENTORIES_CONFIG_OPTIONS)
    private readonly options: InventoriesModuleOptions,
    @Inject(InventoriesFormulaService)
    private readonly inventoriesFormula: InventoriesFormulaService,
    @Inject(InventoriesUtilService)
    private readonly inventoriesUtil: InventoriesUtilService,
    // @Inject(BalanceHelperForHeadphone)
    // private readonly balanceHelper: BalanceHelperForMysteryBox,
    @Inject(PoliciesService)
    private readonly policiesService: PoliciesService,
    @Inject(SpendingBalancesService)
    private readonly spendingBalancesService: SpendingBalancesService,
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
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  // Create mystery box by luck of items
  async createMysteryBox(createMysteryBoxDto: CreateMysteryBoxDto) {
    // retrieve headphone info with headphone id
    const headphone = await this.headphoneRepository.findOne({
      where: {
        item: createMysteryBoxDto.headphoneId,
      },
    });

    if (!headphone) {
      throw new HttpException('Headphone not found', HttpStatus.NOT_FOUND);
    }

    try {
      const energyConsumption = createMysteryBoxDto.energyConsumption;
      const headphoneLuck = headphone.luck;

      // calculate the mysterybox value
      const MysteryBoxValue =
        energyConsumption *
        Math.pow(headphoneLuck, Number(process.env.MYSTERYBOX_SYSTEM_VALUE));

      // Create a random number
      const randomNumber =
        Math.floor(
          Math.random() *
            (Number(process.env.MYSTERYBOX_MAX_PARAMETER) -
              Number(process.env.MYSTERYBOX_MIN_PARAMETER) +
              1)
        ) + Number(process.env.MYSTERYBOX_MIN_PARAMETER);

      // get battery adjustment factor
      const batteryAdjustmentFactor =
        this.inventoriesFormula.getDurabilityAdjustmentFactor(
          +headphone.battery
        );

      // calculate the mysterybox quality value
      const mysteryBoxQualityValue =
        MysteryBoxValue * randomNumber * batteryAdjustmentFactor;

      // Quality 확률에 맞춰 생성
      const calculatedMysteryBoxQuality: MysteryBoxQuality =
        this.inventoriesFormula.getMysteryBoxQuality(mysteryBoxQualityValue);

      let createdMysteryBox: MysteryBox;
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          const newItem = this.itemRepository.create({
            user: createMysteryBoxDto.userId,
            itemStatus: ItemStatus.NOT_OPENED,
            imgUrl: `https://i.imgur.com/XqQXQ.png`,
            type: ItemType.MYSTERYBOX,
          });

          const item = await manager.save(newItem);

          const newMysteryBox = this.mysteryBoxRepository.create({
            item: item.id,
            quality: calculatedMysteryBoxQuality,
            openingTimeCountdown:
              this.inventoriesFormula.getMysteryBoxOpeningTime(
                calculatedMysteryBoxQuality
              ),
          });

          createdMysteryBox = await manager.save(newMysteryBox);
        });

      return createdMysteryBox;
    } catch (error) {
      this.logger.error(
        error,
        `createMysteryBox(${createMysteryBoxDto.userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async openMysteryBox(openMysteryBoxDto: OpenMysteryBoxDto, userId: number) {
    try {
      const mysteryBox = await this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'item')
        .where('mysteryBox.item = :itemId', {
          itemId: openMysteryBoxDto.mysteryBoxId,
        })
        .andWhere('item.user = :userId', { userId })
        .getOne();

      if (!mysteryBox) {
        throw new HttpException('MysteryBox not found', HttpStatus.NOT_FOUND);
      }

      const itemInfo = mysteryBox.item as Item;
      this.policiesService.updateItemStatus(itemInfo).toOpened();

      if (mysteryBox.openingTimeCountdown.isAfter(LocalDateTime.now())) {
        throw new HttpException(
          'MysteryBox can not opened yet',
          HttpStatus.BAD_REQUEST
        );
      }

      // mysterybox 오픈 시 필요한 밸런스 체크
      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      // mysteryBox 오픈 시 필요한 비용 계산
      const mysteryBoxQuality = mysteryBox.quality;
      const openMysteryBoxCosts =
        this.inventoriesFormula.calculateOpenMysteryBoxCosts(mysteryBoxQuality);

      // const itemInfoForBalanceCheck = {
      //   type: itemInfo.type,
      //   purpose: BalanceCheckPurpose.MYSTERYBOX_OPEN,
      //   items: mysteryBox,
      //   requiredCosts: openMysteryBoxCosts,
      // };

      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      // mysterybox 오픈 시 퀄리티에 따라 아이템 생성
      const itemFromMysteryBox =
        this.inventoriesFormula.getItemFromMysteryBox(mysteryBoxQuality);

      let createdItemResult;
      const itemTypeFromOpenedMysteryBox = itemFromMysteryBox.type;
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const openCost of openMysteryBoxCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              openCost,
              manager
            );
          }
          // 생성 아이템 별 생성
          createdItemResult = await this.createItemFromMysteryBox(
            itemTypeFromOpenedMysteryBox,
            userId,
            manager,
            itemFromMysteryBox,
            userSpendingBalances
          );

          // mysterybox 오픈 시 mysterybox 상태 변경
          const updateMysteryBox = this.mysteryBoxRepository.create({
            openingTimeCountdown: null,
          });
          await manager.update(MysteryBox, itemInfo.id, updateMysteryBox);

          const updateItem = this.itemRepository.create({
            itemStatus: ItemStatus.OPENED,
            updatedAt: LocalDateTime.now(),
          });

          await manager.update(Item, itemInfo.id, updateItem);
        });

      const result = this.inventoriesUtil.retrieveOpenedMysteryBoxData(
        openMysteryBoxDto.mysteryBoxId,
        userId,
        itemTypeFromOpenedMysteryBox,
        createdItemResult
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `openMysteryBox(${openMysteryBoxDto.mysteryBoxId}, ${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async boostOpenMysteryBox(
    openMysteryBoxDto: OpenMysteryBoxDto,
    userId: number
  ) {
    try {
      const mysteryBox = await this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'item')
        .where('mysteryBox.item = :itemId', {
          itemId: openMysteryBoxDto.mysteryBoxId,
        })
        .andWhere('item.user = :userId', { userId })
        .getOne();

      if (!mysteryBox) {
        throw new HttpException('MysteryBox not found', HttpStatus.NOT_FOUND);
      }

      const itemInfo = mysteryBox.item as Item;
      this.policiesService.updateItemStatus(itemInfo).toOpened();

      // mysterybox boosting 오픈 시 필요한 밸런스 체크
      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      // mysterybox boosting 오픈 시 필요한 비용 계산
      const mysteryBoxQuality = mysteryBox.quality;
      const boostingOpenMysteryBoxCosts =
        this.inventoriesFormula.calculateBoostOpenMysteryBoxCosts(
          mysteryBoxQuality,
          mysteryBox.openingTimeCountdown
        );

      // const itemInfoForBalanceCheck = {
      //   type: itemInfo.type,
      //   items: mysteryBox,
      //   purpose: BalanceCheckPurpose.BOOST,
      //   requiredCosts: boostingOpenMysteryBoxCosts,
      // };

      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      // mysterybox boosting 오픈 시 퀄리티에 따라 아이템 생성
      const itemFromMysteryBox =
        this.inventoriesFormula.getItemFromMysteryBox(mysteryBoxQuality);
      let createdItemResult;
      const itemTypeFromOpenedMysteryBox = itemFromMysteryBox.type;
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const boostingOpenMysteryBoxCost of boostingOpenMysteryBoxCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              boostingOpenMysteryBoxCost,
              manager
            );
          }
          // 생성 아이템 별 생성
          createdItemResult = await this.createItemFromMysteryBox(
            itemTypeFromOpenedMysteryBox,
            userId,
            manager,
            itemFromMysteryBox,
            userSpendingBalances
          );
          // mysterybox boosting 오픈 시 mysterybox 상태 변경
          const updateMysteryBox = this.mysteryBoxRepository.create({
            openingTimeCountdown: null,
          });
          await manager.update(MysteryBox, itemInfo.id, updateMysteryBox);

          const updateItem = this.itemRepository.create({
            itemStatus: ItemStatus.OPENED,
            updatedAt: LocalDateTime.now(),
          });

          await manager.update(Item, itemInfo.id, updateItem);
        });
      const result = this.inventoriesUtil.retrieveOpenedMysteryBoxData(
        openMysteryBoxDto.mysteryBoxId,
        userId,
        itemTypeFromOpenedMysteryBox,
        createdItemResult
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `openMysteryBox(${openMysteryBoxDto.mysteryBoxId}, ${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveAllMysteryBoxesByUserId(
    userId: number,
    pageOptionsDto: PageOptionsDto
  ) {
    // join mysteryBoxes table with items table to get all mysteryBoxes of a user
    try {
      const queryBuilder = this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'items')
        .where('items.user = :userId', { userId: userId })
        .andWhere('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.NOT_OPENED,
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
        `retrieveAllMysteryBoxesByUserId(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveMysteryBoxDetailByItemId(itemId: number) {
    try {
      const result = await this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'items')
        .where('items.id = :itemId', { itemId: itemId })
        .andWhere('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.NOT_OPENED,
        })
        .getOne();

      if (!result) {
        throw new NotFoundException('MysteryBox not found');
      }

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveMysteryBoxDetailByUserIdAndItemId(${itemId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedMysteryBoxOpenCost(mysteryBoxId: number, userId: number) {
    try {
      const mysteryBox = await this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'item')
        .where('mysteryBox.item = :itemId', { itemId: mysteryBoxId })
        .andWhere('item.user = :userId', { userId })
        .getOne();

      if (!mysteryBox) {
        throw new HttpException('MysteryBox not found', HttpStatus.NOT_FOUND);
      }

      const itemInfo = mysteryBox.item as Item;
      this.policiesService.updateItemStatus(itemInfo).toOpened();

      if (mysteryBox.openingTimeCountdown.isAfter(LocalDateTime.now())) {
        throw new HttpException(
          'MysteryBox can not opened yet',
          HttpStatus.BAD_REQUEST
        );
      }

      // mysterybox 오픈 시 필요한 비용 계산
      const mysteryBoxQuality = mysteryBox.quality;
      const openMysteryBoxCosts =
        this.inventoriesFormula.calculateOpenMysteryBoxCosts(mysteryBoxQuality);

      return openMysteryBoxCosts;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedMysteryBoxOpenCost(${mysteryBoxId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedBoostingMysteryBoxOpenCost(
    mysteryBoxId: number,
    userId: number
  ) {
    try {
      const mysteryBox = await this.mysteryBoxRepository
        .createQueryBuilder('mysteryBox')
        .leftJoinAndSelect('mysteryBox.item', 'item')
        .where('mysteryBox.item = :itemId', { itemId: mysteryBoxId })
        .andWhere('item.user = :userId', { userId })
        .getOne();

      if (!mysteryBox) {
        throw new HttpException('MysteryBox not found', HttpStatus.NOT_FOUND);
      }

      const itemInfo = mysteryBox.item as Item;
      this.policiesService.updateItemStatus(itemInfo).toOpened();

      // mysterybox 오픈 시 필요한 비용 계산
      const openMysteryBoxCosts =
        this.inventoriesFormula.calculateBoostOpenMysteryBoxCosts(
          mysteryBox.quality,
          mysteryBox.openingTimeCountdown
        );

      return openMysteryBoxCosts;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedMysteryBoxOpenCost(${mysteryBoxId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async updateMysteryBox(updateMysteryBoxDto: UpdateMysteryBoxDto) {
    const item = await this.itemRepository.findOneBy({
      id: updateMysteryBoxDto.id,
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const mysteryBox = await this.mysteryBoxRepository.findOneBy({
      item: updateMysteryBoxDto.id,
    });
    if (!mysteryBox) {
      throw new NotFoundException('MysteryBox not found');
    }

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          if (updateMysteryBoxDto.item) {
            const updateItem = this.itemRepository.create(
              updateMysteryBoxDto.item
            );
            await manager.update(Item, updateMysteryBoxDto.id, updateItem);
          }

          if (updateMysteryBoxDto.mysteryBox) {
            const updateMysteryBox = this.mysteryBoxRepository.create(
              updateMysteryBoxDto.mysteryBox
            );
            await manager.update(
              MysteryBox,
              updateMysteryBoxDto.id,
              updateMysteryBox
            );
          }
        });

      return { result: 'Success to update MysteryBox' };
    } catch (error) {
      this.logger.error(
        error,
        `updateMysteryBox(${updateMysteryBoxDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async deleteMysteryBox(mysteryBoxId: number) {
    const item = await this.itemRepository.findOneBy({ id: mysteryBoxId });
    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    const mysteryBox = await this.mysteryBoxRepository.findOneBy({
      item: mysteryBoxId,
    });
    if (!mysteryBox) {
      throw new HttpException('MysteryBox not found', HttpStatus.NOT_FOUND);
    }

    try {
      // mysteryBox, item 삭제
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          await manager.remove(mysteryBox);
          await manager.remove(item);
        });

      return { result: 'Success to delete MysteryBox' };
    } catch (error) {
      this.logger.error(
        error,
        `deleteMysteryBox(${mysteryBoxId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  private async createItemFromMysteryBox(
    itemTypeFromOpenedMysteryBox: ItemTypeFromMysteryBox,
    userId: number,
    manager: EntityManager,
    itemFromMysteryBox: ItemFromMysteryBox,
    userSpendingBalances: UserSpendingBalanceDto[]
  ) {
    let createdItemResult;
    switch (itemTypeFromOpenedMysteryBox) {
      case ItemTypeFromMysteryBox.HEADPHONEBOX: {
        const newItemEntity = this.itemRepository.create({
          user: userId,
          // TODO: URL 동적 생성
          imgUrl: `https://i.imgur.com/XqQXQ.png`,
          type: ItemType.HEADPHONEBOX,
          itemStatus: ItemStatus.NOT_OPENED,
        });

        const createdHeadphoneBoxItem = await manager.save(newItemEntity);
        // new headphonebox 생성
        const newHeadphoneBox = itemFromMysteryBox.item as HeadphoneBox;
        newHeadphoneBox.item = createdHeadphoneBoxItem.id;
        const createdNewHeadphoneBoxEntity =
          this.headphoneBoxRepository.create(newHeadphoneBox);
        createdItemResult = await manager.save(createdNewHeadphoneBoxEntity);
        break;
      }

      case ItemTypeFromMysteryBox.STICKER: {
        const newItemEntity = this.itemRepository.create({
          user: userId,
          type: ItemType.STICKER,
          // TODO: level/attribute에 따라 이미지 링크 변경
          imgUrl: 'https://i.imgur.com/QQHJq.png',
          itemStatus: ItemStatus.NOT_INSERTED,
        });
        const createdStickerItem = await manager.save(newItemEntity);
        // new sticker 생성
        const newSticker = itemFromMysteryBox.item as Sticker;
        newSticker.item = createdStickerItem.id;
        const createdNewStickerEntity =
          this.stickerRepository.create(newSticker);
        createdItemResult = await manager.save(createdNewStickerEntity);
        break;
      }

      case ItemTypeFromMysteryBox.BLB: {
        const newBlbAmount = itemFromMysteryBox.item as number;
        const addBlbCostDto: CostDto = {
          tokenSymbol: TokenSymbol.BLB,
          requiredCost: newBlbAmount,
        };

        this.spendingBalancesService.addSpendingBalances(
          userSpendingBalances,
          addBlbCostDto,
          manager
        );

        createdItemResult = {
          newBlbAmount,
        };
        break;
      }

      default:
        throw new BadRequestException('Invalid item type');
    }
    return createdItemResult;
  }
}
