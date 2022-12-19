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
  Attribute,
  ItemType,
  CreateStickerDto,
  UpdateStickerDto,
  ItemStatus,
  InsertStickerRequestDto,
  DockStatus,
  UserSpendingBalanceDto,
  BalanceCheckPurpose,
  EnhanceStickerRequestDto,
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
import { PoliciesService } from '@src/modules/policies/policies.service';
import { BalanceHelperForSticker } from '@src/common/balance-helper';
import { LocalDateTime } from '@js-joda/core';
import { InventoriesUtilService } from '../inventories-util.service';
import { SpendingBalancesService } from '@src/modules/spending-balances/spending-balances.service';

@Injectable()
export class StickersService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(INVENTORIES_CONFIG_OPTIONS)
    private readonly options: InventoriesModuleOptions,
    @Inject(InventoriesFormulaService)
    private readonly inventoriesFormula: InventoriesFormulaService,
    @Inject(InventoriesUtilService)
    private readonly inventoriesUtil: InventoriesUtilService,
    @Inject(PoliciesService)
    private readonly policiesService: PoliciesService,
    // @Inject(BalanceHelperForSticker)
    // private readonly balanceHelper: BalanceHelperForSticker,
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

  /**
   * @deprecated
   */
  async createSticker(createStickerDto: CreateStickerDto) {
    let createdSticker: Sticker;

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // create item
          // imgURL 동적으로 입력 받아야 함 또는 생성 필요
          const newItem = this.itemRepository.create({
            user: createStickerDto.userId,
            itemStatus: ItemStatus.NOT_INSERTED,
            imgUrl: `https://i.imgur.com/XqQXQ.png`,
            type: ItemType.STICKER,
          });

          const item = await manager.save(newItem);

          // create sticker
          // attribute 및 level를 확률에 맞춰 생성
          const newSticker = this.stickerRepository.create({
            item: item.id,
            attribute: Attribute.EFFICIENCY,
            level: 1,
          });

          createdSticker = await manager.save(newSticker);
        });

      return createdSticker;
    } catch (error) {
      this.logger.error(
        error,
        `createSticker(${createStickerDto.userId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async enhanceSticker(
    enhanceStickerRequestDto: EnhanceStickerRequestDto,
    userId: number
  ) {
    try {
      const { stickerOneId, stickerTwoId, stickerThreeId } =
        enhanceStickerRequestDto;

      // check if ids are all different
      if (
        stickerOneId === stickerTwoId ||
        stickerOneId === stickerThreeId ||
        stickerTwoId === stickerThreeId
      ) {
        throw new BadRequestException('Sticker ids are duplicated');
      }

      // const stickerOne = await this.stickerRepository
      //   .createQueryBuilder('sticker')
      //   .leftJoinAndSelect('sticker.item', 'items')
      //   .where('items.id = :itemId', { itemId: stickerOneId })
      //   .andWhere('items.user = :userId', { userId: userId })
      //   .getOne();

      // if (!stickerOne) {
      //   throw new NotFoundException('Sticker not found');
      // }

      // const stickerTwo = await this.stickerRepository
      //   .createQueryBuilder('sticker')
      //   .leftJoinAndSelect('sticker.item', 'items')
      //   .where('items.id = :itemId', { itemId: stickerTwoId })
      //   .andWhere('items.user = :userId', { userId: userId })
      //   .getOne();

      // if (!stickerTwo) {
      //   throw new NotFoundException('Sticker not found');
      // }

      // const stickerThree = await this.stickerRepository
      //   .createQueryBuilder('sticker')
      //   .leftJoinAndSelect('sticker.item', 'items')
      //   .where('items.id = :itemId', { itemId: stickerThreeId })
      //   .andWhere('items.user = :userId', { userId: userId })
      //   .getOne();

      // if (!stickerThree) {
      //   throw new NotFoundException('Sticker not found');
      // }
      const [stickerOne, stickerTwo, stickerThree] = await Promise.all(
        [stickerOneId, stickerTwoId, stickerThreeId].map(async (itemId) => {
          return await this.stickerRepository
            .createQueryBuilder('sticker')
            .leftJoinAndSelect('sticker.item', 'items')
            .where('items.id = :itemId', { itemId })
            .andWhere('items.user = :userId', { userId })
            .getOne();
        })
      );

      if (!stickerOne || !stickerTwo || !stickerThree) {
        throw new NotFoundException('Sticker not found');
      }

      // check validation of sticker status
      const stickerOneItem = stickerOne.item as Item;
      const stickerTwoItem = stickerTwo.item as Item;
      const stickerThreeItem = stickerThree.item as Item;
      this.policiesService.validationCheckForEnhanceStickersWith(
        stickerOneItem,
        stickerTwoItem,
        stickerThreeItem
      );

      // check validation of sticker level
      if (
        stickerOne.level < 1 ||
        stickerOne.level > 8 ||
        stickerTwo.level < 1 ||
        stickerTwo.level > 8 ||
        stickerThree.level < 1 ||
        stickerThree.level > 8
      ) {
        throw new BadRequestException('Sticker level is not valid');
      }
      if (
        stickerOne.level !== stickerTwo.level ||
        stickerOne.level !== stickerThree.level
      ) {
        throw new BadRequestException('Sticker level must be same');
      }

      // check validation of sticker attribute
      if (
        stickerOne.attribute !== stickerTwo.attribute ||
        stickerOne.attribute !== stickerThree.attribute
      ) {
        throw new BadRequestException('Sticker attribute must be same');
      }

      const userSpendingBalances: UserSpendingBalanceDto[] =
        await this.inventoriesUtil.retrieveUserSpendingBalances(userId);

      // calculate cost
      const calculatedEnhanceStickersCosts =
        await this.inventoriesFormula.calculateEnhanceStickersCost(
          stickerOne.level
        );

      // const itemInfoForBalanceCheck = {
      //   type: stickerOneItem.type,
      //   purpose: BalanceCheckPurpose.ENHANCE,
      //   items: stickerOne,
      //   requiredCosts: calculatedEnhanceStickersCosts,
      // };
      // const checkBalance = this.balanceHelper.checkBalance(
      //   userSpendingBalances,
      //   itemInfoForBalanceCheck
      // );
      // if (!checkBalance) {
      //   throw new BadRequestException('Not enough balance');
      // }

      // create new sticker from 3 stickers
      const newSticker = this.inventoriesFormula.getStickerFromEnhance(
        stickerOne.level,
        stickerOne.attribute
      );

      let createdNewSticker: Sticker;

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Token 별 소요 비용 차감
          for await (const enhanceCost of calculatedEnhanceStickersCosts.costs) {
            await this.spendingBalancesService.deductSpendingBalances(
              userSpendingBalances,
              enhanceCost,
              manager
            );
          }

          // new item 생성 only if new sticker is created
          if (newSticker) {
            const newItemEntity = this.itemRepository.create({
              user: userId,
              type: ItemType.STICKER,
              // TODO: level/attribute에 따라 이미지 링크 변경
              imgUrl: 'https://i.imgur.com/QQHJq.png',
              itemStatus: ItemStatus.NOT_INSERTED,
            });
            const createdItem = await manager.save(newItemEntity);
            // new sticker 생성
            newSticker.item = createdItem.id;
            const createdNewStickerEntity =
              this.stickerRepository.create(newSticker);
            createdNewSticker = await manager.save(createdNewStickerEntity);
          }

          // TODO: save to history table (old stickers's status BURNED)
          // const updateStickerOne = this.itemRepository.create({
          //   itemStatus: ItemStatus.BURNED,
          //   updatedAt: LocalDateTime.now(),
          // });
          // const updateStickerTwo = this.itemRepository.create({
          //   itemStatus: ItemStatus.BURNED,
          //   updatedAt: LocalDateTime.now(),
          // });
          // const updateStickerThree = this.itemRepository.create({
          //   itemStatus: ItemStatus.BURNED,
          //   updatedAt: LocalDateTime.now(),
          // });
          // await manager.save(Item, updateStickerOne);
          // await manager.save(Item, updateStickerTwo);
          // await manager.save(Item, updateStickerThree);

          // delete old stickers
          await this.stickerRepository.delete(stickerOneItem.id);
          await this.itemRepository.delete(stickerOneItem.id);
          await this.stickerRepository.delete(stickerTwoItem.id);
          await this.itemRepository.delete(stickerTwoItem.id);
          await this.stickerRepository.delete(stickerThreeItem.id);
          await this.itemRepository.delete(stickerThreeItem.id);
        });

      let result;
      if (newSticker) {
        result = await this.inventoriesUtil.retrieveUpdatedStickerData(
          createdNewSticker.item as number,
          userId,
          true
        );
      } else {
        result = 'Failed to enhance sticker';
      }

      return result;
    } catch (error) {
      this.logger.error(error, `enhanceSticker(${userId})`, 'StickersService');
      exceptionHandler(error);
    }
  }

  async retrieveAllStickersByUserId(
    userId: number,
    pageOptionsDto: PageOptionsDto
  ) {
    try {
      const queryBuilder = this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.user = :userId', { userId: userId });

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
        `retrieveAllStickersByUserId(${userId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveAllStickersByAttribute(
    userId: number,
    pageOptionsDto: PageOptionsDto,
    attribute: Attribute
  ) {
    try {
      const queryBuilder = this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .where('items.user = :userId', { userId: userId })
        .andWhere('items.itemStatus = :itemStatus', {
          itemStatus: ItemStatus.NOT_INSERTED,
        })
        .andWhere('sticker.attribute = :attribute', { attribute: attribute });

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
        `retrieveAllStickersByUserId(${userId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveStickerDetailByItemId(itemId: number) {
    try {
      const result = await this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.id = :itemId', { itemId: itemId })
        .getOne();

      if (!result) {
        throw new NotFoundException('Sticker not found');
      }

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveStickerDetailByItemId(${itemId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  /**
   * @deprecated
   */
  async getCalculatedInsertStickerCost(
    userId: number,
    insertStickerRequestDto: InsertStickerRequestDto
  ) {
    try {
      const { headphoneId, headphoneDockPosition, stickerId } =
        insertStickerRequestDto;

      const headphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!headphone) {
        throw new NotFoundException('Headphone Not found');
      }

      // check validation of headphone
      const headphoneItem = headphone.item as Item;
      this.policiesService.validationCheckForInsertStickerWith(headphoneItem);

      const sticker = await this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .where('items.id = :itemId', { itemId: stickerId })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!sticker) {
        throw new NotFoundException('Sticker not found');
      }

      // check validation of sticker
      const stickerItem = sticker.item as Item;
      this.policiesService.validationCheckForInsertStickerWith(stickerItem);

      const headphoneDock = await this.headphoneDockRepository
        .createQueryBuilder('headphone_dock')
        .leftJoinAndSelect('headphone_dock.headphone', 'headphone')
        .where('headphone.id = :headphoneId', { headphoneId: headphoneId })
        .andWhere('headphone_dock.position = :position', {
          position: headphoneDockPosition,
        })
        .andWhere('headphone_dock.dockStatus = :status', {
          status: DockStatus.OPENED,
        })
        .getOne();

      if (!headphoneDock) {
        throw new NotFoundException('Available heeadphone Dock not found');
      }

      // check limitations for inserting sticker to dock
      if (headphoneDock.attribute !== sticker.attribute) {
        throw new BadRequestException(
          'Sticker attribute must be same with headphone dock attribute'
        );
      }

      // calculate increasing stats with sticker and dock
      const calculatedInsertStickerCosts =
        await this.inventoriesFormula.calculateInsertStickerCost(
          headphone.quality,
          headphone.level,
          sticker.level,
          headphoneDock.quality
        );

      return calculatedInsertStickerCosts;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedInsertStickerCost(${userId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async getCalculatedEnhanceStickersCost(
    userId: number,
    enhanceStickerRequestDto: EnhanceStickerRequestDto
  ) {
    try {
      const { stickerOneId, stickerTwoId, stickerThreeId } =
        enhanceStickerRequestDto;

      // check if ids are all different
      if (
        stickerOneId === stickerTwoId ||
        stickerOneId === stickerThreeId ||
        stickerTwoId === stickerThreeId
      ) {
        throw new BadRequestException('Sticker ids are duplicated');
      }

      // const stickerOne = await this.stickerRepository
      //   .createQueryBuilder('sticker')
      //   .leftJoinAndSelect('sticker.item', 'items')
      //   .where('items.id = :itemId', { itemId: stickerOneId })
      //   .andWhere('items.user = :userId', { userId: userId })
      //   .getOne();

      // if (!stickerOne) {
      //   throw new NotFoundException('Sticker not found');
      // }

      // const stickerTwo = await this.stickerRepository
      //   .createQueryBuilder('sticker')
      //   .leftJoinAndSelect('sticker.item', 'items')
      //   .where('items.id = :itemId', { itemId: stickerTwoId })
      //   .andWhere('items.user = :userId', { userId: userId })
      //   .getOne();

      // if (!stickerTwo) {
      //   throw new NotFoundException('Sticker not found');
      // }

      // const stickerThree = await this.stickerRepository
      //   .createQueryBuilder('sticker')
      //   .leftJoinAndSelect('sticker.item', 'items')
      //   .where('items.id = :itemId', { itemId: stickerThreeId })
      //   .andWhere('items.user = :userId', { userId: userId })
      //   .getOne();

      // if (!stickerThree) {
      //   throw new NotFoundException('Sticker not found');
      // }
      const [stickerOne, stickerTwo, stickerThree] = await Promise.all(
        [stickerOneId, stickerTwoId, stickerThreeId].map(async (itemId) => {
          return await this.stickerRepository
            .createQueryBuilder('sticker')
            .leftJoinAndSelect('sticker.item', 'items')
            .where('items.id = :itemId', { itemId })
            .andWhere('items.user = :userId', { userId })
            .getOne();
        })
      );

      if (!stickerOne || !stickerTwo || !stickerThree) {
        throw new NotFoundException('Sticker not found');
      }

      // check validation of sticker status
      // const stickerOneItem = stickerOne.item as Item;
      // const stickerTwoItem = stickerTwo.item as Item;
      // const stickerThreeItem = stickerThree.item as Item;
      this.policiesService.validationCheckForEnhanceStickersWith(
        stickerOne.item as Item,
        stickerTwo.item as Item,
        stickerThree.item as Item
      );

      // check validation of sticker level
      if (
        stickerOne.level !== stickerTwo.level ||
        stickerOne.level !== stickerThree.level
      ) {
        throw new BadRequestException('Sticker level must be same');
      }

      // check validation of sticker attribute
      if (
        stickerOne.attribute !== stickerTwo.attribute ||
        stickerOne.attribute !== stickerThree.attribute
      ) {
        throw new BadRequestException('Sticker attribute must be same');
      }

      // calculate cost
      const calculatedEnhanceStickersCosts =
        await this.inventoriesFormula.calculateEnhanceStickersCost(
          stickerOne.level
        );

      return calculatedEnhanceStickersCosts;
    } catch (error) {
      this.logger.error(
        error,
        `getCalculatedEnhanceStickersCost(${userId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async updateSticker(updateStickerDto: UpdateStickerDto) {
    const item = await this.itemRepository.findOneBy({
      id: updateStickerDto.id,
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const sticker = await this.stickerRepository.findOneBy({
      item: updateStickerDto.id,
    });
    if (!sticker) {
      throw new NotFoundException('Sticker not found');
    }

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          if (updateStickerDto.item) {
            const updateItem = this.itemRepository.create(
              updateStickerDto.item
            );
            await manager.update(Item, updateStickerDto.id, updateItem);
          }

          if (updateStickerDto.sticker) {
            const updateSticker = this.stickerRepository.create(
              updateStickerDto.sticker
            );
            await manager.update(Sticker, updateStickerDto.id, updateSticker);
          }
        });

      return { result: 'Success to update Sticker' };
    } catch (error) {
      this.logger.error(
        error,
        `updateSticker(${updateStickerDto})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async insertSticker(
    insertStickerRequestDto: InsertStickerRequestDto,
    userId: number
  ) {
    try {
      const { headphoneId, headphoneDockPosition, stickerId } =
        insertStickerRequestDto;

      const headphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!headphone) {
        throw new NotFoundException('Headphone Not found');
      }

      // check validation of headphone
      const headphoneItem = headphone.item as Item;
      this.policiesService.validationCheckForInsertStickerWith(headphoneItem);

      const sticker = await this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .where('items.id = :itemId', { itemId: stickerId })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!sticker) {
        throw new NotFoundException('Sticker not found');
      }

      // check validation of sticker
      const stickerItem = sticker.item as Item;
      this.policiesService.validationCheckForInsertStickerWith(stickerItem);

      const headphoneDock = await this.headphoneDockRepository
        .createQueryBuilder('headphone_dock')
        .leftJoinAndSelect('headphone_dock.headphone', 'headphone')
        .where('headphone.id = :headphoneId', { headphoneId: headphoneId })
        .andWhere('headphone_dock.position = :position', {
          position: headphoneDockPosition,
        })
        .andWhere('headphone_dock.dockStatus = :status', {
          status: DockStatus.OPENED,
        })
        .getOne();

      if (!headphoneDock) {
        throw new NotFoundException('Available headphone Dock not found');
      }

      // check limitations for inserting sticker to dock
      if (headphoneDock.attribute !== sticker.attribute) {
        throw new BadRequestException(
          'Sticker attribute must be same with headphone dock attribute'
        );
      }

      // calculate increasing stats with sticker and dock
      const calculatedIncreaseStats =
        this.inventoriesFormula.calculateIncreaseStatsInsertSticker(
          headphone,
          headphoneDock.quality,
          headphoneDockPosition,
          sticker.level,
          sticker.attribute
        );

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Sticker insert to headphone dock
          const insertHeadphoneDock = this.headphoneDockRepository.create({
            headphone: headphone,
            position: headphoneDockPosition,
            dockStatus: DockStatus.INSERTED,
            sticker: stickerItem.id,
          });
          await manager.update(
            HeadphoneDock,
            headphoneDock.id,
            insertHeadphoneDock
          );

          // Sticker itemStatus update to 'INSERTED'
          const insertStickerItem = this.itemRepository.create({
            itemStatus: ItemStatus.INSERTED,
            updatedAt: LocalDateTime.now(),
          });
          await manager.update(Item, stickerId, insertStickerItem);

          // update headphone stats
          const updateHeadphone = this.headphoneRepository.create({
            ...calculatedIncreaseStats,
          });
          await manager.update(Headphone, headphoneId, updateHeadphone);

          // Headphone updatedAt update
          const updateHeadphoneItem = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
          });
          await manager.update(Item, headphoneItem.id, updateHeadphoneItem);
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        headphoneItem.id,
        userId,
        false
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `insertSticker(${insertStickerRequestDto})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async removeStickerFromDock(
    removeStickerRequestDto: InsertStickerRequestDto,
    userId: number
  ) {
    try {
      const { headphoneId, headphoneDockPosition, stickerId } =
        removeStickerRequestDto;

      const headphone = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.id = :itemId', {
          itemId: headphoneId,
        })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!headphone) {
        throw new NotFoundException('Headphone Not found');
      }

      // check validation of headphone
      const headphoneItem = headphone.item as Item;
      this.policiesService.validationCheckForRemoveStickerFromDockWith(
        headphoneItem
      );

      const sticker = await this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .where('items.id = :itemId', { itemId: stickerId })
        .andWhere('items.user = :userId', { userId: userId })
        .getOne();

      if (!sticker) {
        throw new NotFoundException('Sticker not found');
      }

      // check validation of sticker
      const stickerItem = sticker.item as Item;
      this.policiesService.validationCheckForRemoveStickerFromDockWith(
        stickerItem
      );

      const headphoneDock = await this.headphoneDockRepository
        .createQueryBuilder('headphone_dock')
        .leftJoinAndSelect('headphone_dock.headphone', 'headphone')
        .where('headphone.id = :headphoneId', {
          headphoneId: headphoneId,
        })
        .andWhere('headphone_dock.position = :position', {
          position: headphoneDockPosition,
        })
        .andWhere('headphone_dock.dockStatus = :status', {
          status: DockStatus.INSERTED,
        })
        .getOne();

      if (!headphoneDock) {
        throw new NotFoundException(
          'headphone Dock not found for removing sticker'
        );
      }

      // calculate decresing stats when removing sticker from dock
      const calculatedDecreaseStats =
        await this.inventoriesFormula.calculateDecreaseStatsRemoveSticker(
          headphone,
          headphoneDock.quality,
          headphoneDockPosition,
          sticker.level,
          sticker.attribute
        );

      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // Sticker remove from headphone dock
          const removeHeadphoneDock = this.headphoneDockRepository.create({
            headphone: headphone,
            position: headphoneDockPosition,
            dockStatus: DockStatus.OPENED,
            sticker: null,
          });
          await manager.update(
            HeadphoneDock,
            headphoneDock.id,
            removeHeadphoneDock
          );
          // Sticker itemStatus update to 'NOT_INSERTED'
          const removeStickerItem = this.itemRepository.create({
            itemStatus: ItemStatus.NOT_INSERTED,
            updatedAt: LocalDateTime.now(),
          });
          await manager.update(Item, stickerId, removeStickerItem);

          // update headphone stats
          const updateHeadphone = this.headphoneRepository.create({
            ...calculatedDecreaseStats,
          });
          await manager.update(Headphone, headphoneId, updateHeadphone);

          // Headphone updatedAt update
          const updateHeadphoneItem = this.itemRepository.create({
            updatedAt: LocalDateTime.now(),
          });
          await manager.update(Item, headphoneItem.id, updateHeadphoneItem);
        });

      const result = await this.inventoriesUtil.retrieveUpdatedHeadphoneData(
        headphoneItem.id,
        userId,
        false
      );

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `removeStickerFromDock(${removeStickerRequestDto})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }

  async deleteSticker(stickerId: number) {
    const item = await this.itemRepository.findOneBy({ id: stickerId });
    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    const sticker = await this.stickerRepository.findOneBy({ item: stickerId });
    if (!sticker) {
      throw new HttpException('Sticker not found', HttpStatus.NOT_FOUND);
    }

    try {
      // sticker, item 삭제
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          await manager.remove(sticker);
          await manager.remove(item);
        });

      return { result: 'Success to delete Sticker' };
    } catch (error) {
      this.logger.error(
        error,
        `deleteSticker(${stickerId})`,
        'StickersService'
      );
      exceptionHandler(error);
    }
  }
}
