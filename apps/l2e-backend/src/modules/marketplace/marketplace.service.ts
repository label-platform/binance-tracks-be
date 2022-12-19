import { SpendingBalancesService } from '@src/modules/spending-balances/spending-balances.service';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import {
  Attribute,
  CostDto,
  HeadphoneOrHeadphoneBoxFilterDto,
  ItemStatus,
  ItemType,
  ItemTypeFilter,
  Quality,
  SellDto,
  StickerFilterDto,
  TokenSymbol,
  TradeType,
  UpdateSellingItemDto,
} from '@libs/l2e-queries/dtos';
import {
  Headphone,
  HeadphoneBox,
  Item,
  ItemSale,
  Merchandise,
  Pinballhead,
  SaleHistory,
  SpendingBalance,
  Sticker,
  Ticket,
  User,
} from '@libs/l2e-queries/entities';
import {
  HeadphoneBoxRepository,
  HeadphoneRepository,
  ItemRepository,
  ItemSaleRepository,
  MerchandiseRepository,
  PinballheadRepository,
  SaleHistoryRepository,
  SpendingBalanceRepository,
  StickerRepository,
  TicketRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import { convertNumberWithDecimalCeil } from '@libs/l2e-utils/util-functions';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { DataSource } from 'typeorm';
import { PoliciesService } from '../policies/policies.service';
import { MarketplaceUtilService } from './marketplace-util.service';
import { InventoriesUtilService } from '../inventories';
import { LocalDateTime } from '@js-joda/core';
import { EnergiesService } from '../energies/energies.service';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: ItemRepository,
    @InjectRepository(ItemSale)
    private readonly itemSaleRepository: ItemSaleRepository,
    @InjectRepository(SaleHistory)
    private readonly saleHistoryRepository: SaleHistoryRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @Inject(PoliciesService)
    private readonly policiesService: PoliciesService,
    @Inject(EnergiesService)
    private readonly energyService: EnergiesService,
    @Inject(MarketplaceUtilService)
    private readonly marketplaceUtilService: MarketplaceUtilService,
    @Inject(forwardRef(() => InventoriesUtilService))
    private readonly inventoriesUtil: InventoriesUtilService,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,
    @InjectRepository(HeadphoneBox)
    private readonly headphoneBoxRepository: HeadphoneBoxRepository,
    @InjectRepository(Sticker)
    private readonly stickerRepository: StickerRepository,
    @InjectRepository(Pinballhead)
    private readonly pinballheadRepository: PinballheadRepository,
    @InjectRepository(Ticket)
    private readonly ticketRepository: TicketRepository,
    @InjectRepository(Merchandise)
    private readonly merchandiseRepository: MerchandiseRepository,
    @Inject(SpendingBalancesService)
    private readonly spendingBalancesService: SpendingBalancesService,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async sell(sellDto: SellDto, userId: number) {
    try {
      const { itemId, price } = sellDto;
      const item = await this.itemRepository.findOne({
        relations: ['user'],
        where: { id: itemId },
      });
      if (!item) {
        throw new NotFoundException('item does not exist');
      }
      const user = item.user as User;
      if (user.id !== userId) {
        throw new NotFoundException('do not own the item');
      }

      await this.policiesService.validationCheckForSellBy(item);

      const sellerBalance = await this.spendingBalanceRepository.findOneBy({
        tokenSymbol: TokenSymbol.BNB,
        owner: userId,
      });
      if (!sellerBalance)
        throw new NotFoundException('Seller spending is not exist');

      await this.dataSource.transaction(async (manager) => {
        const newSale = this.itemSaleRepository.create({
          item,
          price,
        });
        await manager.save(newSale);
        await manager.update(Item, itemId, {
          itemStatus: ItemStatus.SELLING,
        });
        const newSaleHistory = this.saleHistoryRepository.create({
          userEmail: user.email,
          userName: user.username,
          userWalletAddress: user.walletAddress,
          itemId,
          type: item.type,
          price,
          tradeType: TradeType.LISTING,
        });
        await manager.save(newSaleHistory);

        if (ItemType.HEADPHONE) {
          // 판매 등록 후 보유한 헤드폰 중 가장 높은 레벨에 맞춰 dailyTokenEarningLimit 계산
          await this.inventoriesUtil.updateDailyTokenEarningLimitByHeadphoneInfo(
            userId,
            manager,
            itemId
          );
        }
      });
      // TODO: transaction 처리 필요
      await this.energyService.updateEnergyCap(userId);

      const result = await this.marketplaceUtilService.retrieveSellData(itemId);
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async updateSell(
    updateSellingItemDto: UpdateSellingItemDto,
    saleId: number,
    userId: number
  ) {
    try {
      const { price } = updateSellingItemDto;
      if (!saleId) {
        throw new BadRequestException('saleId is required');
      }
      const sale = await this.itemSaleRepository.findOne({
        relations: ['item'],
        where: { id: saleId },
      });
      if (!sale) {
        throw new NotFoundException('sale does not exist');
      }

      const item = sale.item as Item;
      const findItem = await this.itemRepository.findOne({
        relations: ['user'],
        where: { id: item.id },
      });

      const user = findItem.user as User;

      if (user.id !== userId) {
        throw new NotFoundException('do not own the item');
      }
      await this.dataSource.transaction(async (manager) => {
        await manager.update(ItemSale, saleId, {
          price,
        });
        const newSaleHistory = this.saleHistoryRepository.create({
          userEmail: user.email,
          userName: user.username,
          userWalletAddress: user.walletAddress,
          itemId: item.id,
          type: item.type,
          price,
          tradeType: TradeType.UPDATE,
        });
        await manager.save(newSaleHistory);
      });
      const result = await this.marketplaceUtilService.retrieveSellData(
        item.id
      );
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async cancelSell(cancelSaleId: number, userId: number) {
    try {
      if (!cancelSaleId) {
        throw new BadRequestException('saleId is required');
      }
      const sale = await this.itemSaleRepository.findOne({
        relations: ['item'],
        where: { id: cancelSaleId },
      });
      if (!sale) {
        throw new NotFoundException('sale does not exist');
      }

      const item = sale.item as Item;
      const findItem = await this.itemRepository.findOne({
        relations: ['user'],
        where: { id: item.id },
      });

      const user = findItem.user as User;

      if (user.id !== userId) {
        throw new NotFoundException('do not own the item');
      }

      await this.dataSource.transaction(async (manager) => {
        const newSaleHistory = this.saleHistoryRepository.create({
          userEmail: user.email,
          userName: user.username,
          userWalletAddress: user.walletAddress,
          type: findItem.type,
          itemId: findItem.id,
          price: sale.price,
          tradeType: TradeType.REVOKE,
        });
        await manager.save(newSaleHistory);
        this.policiesService.updateItemStatus(findItem).afterCancel();
        await manager.update(Item, findItem.id, {
          itemStatus: findItem.itemStatus,
        });
        await manager.delete(ItemSale, cancelSaleId);
      });

      // TODO: 별개 트랜잭션으로 나눠져있음. 방법을 찾아 동일한 트랜잭션으로 묶어야 함
      if (ItemType.HEADPHONE) {
        await this.dataSource.transaction(async (manager) => {
          // 판매 등록 취소 후 보유한 헤드폰 중 가장 높은 레벨에 맞춰 dailyTokenEarningLimit 계산
          await this.inventoriesUtil.updateDailyTokenEarningLimitByHeadphoneInfo(
            userId,
            manager
          );
        });
        // TODO: transaction 처리 필요
        await this.energyService.updateEnergyCap(userId);
      }
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async buy(saleId: number, userId: number) {
    try {
      if (!saleId) {
        throw new BadRequestException('saleId is required');
      }
      const sale = await this.itemSaleRepository.findOne({
        relations: ['item'],
        where: { id: saleId },
      });
      if (!sale) {
        throw new NotFoundException('sale does not exist');
      }
      const item = sale.item as Item;
      const findItem = await this.itemRepository.findOne({
        relations: ['user'],
        where: { id: item.id },
      });

      const sellerUserInfo = findItem.user as User;
      if (sellerUserInfo.id === userId) {
        throw new BadRequestException('cannot buy your own item');
      }

      await this.dataSource.transaction(async (manager) => {
        const buyerBalances = await this.spendingBalanceRepository.findBy({
          owner: userId,
        });

        const sellerBalances = await this.spendingBalanceRepository.findBy({
          owner: sellerUserInfo.id,
        });
        const marketFee = convertNumberWithDecimalCeil(sale.price * 0.02, 3); // 2% market fee
        const artistRoyalty = convertNumberWithDecimalCeil(
          sale.price * 0.04,
          3
        ); // 4% artist royalty

        await this.spendingBalancesService.deductSpendingBalances(
          buyerBalances as SpendingBalance[],
          { tokenSymbol: TokenSymbol.BNB, requiredCost: sale.price } as CostDto,
          manager
        );
        await this.spendingBalancesService.addSpendingBalances(
          sellerBalances as SpendingBalance[],
          {
            tokenSymbol: TokenSymbol.BNB,
            requiredCost: sale.price - marketFee - artistRoyalty,
          } as CostDto,
          manager
        );
        await manager.update(Item, item.id, { user: userId });
        await manager.delete(ItemSale, saleId);

        const user = await this.userRepository.findOneBy({ id: userId });
        const newSaleHistory = this.saleHistoryRepository.create({
          userEmail: user.email,
          userName: user.username,
          userWalletAddress: user.walletAddress,
          type: item.type,
          itemId: item.id,
          price: sale.price,
          tradeType: TradeType.SOLD,
        });
        await manager.save(newSaleHistory);
        this.policiesService.updateItemStatus(findItem).afterBuy();
        await manager.update(Item, findItem.id, {
          itemStatus: findItem.itemStatus,
        });
        if (item.type === ItemType.HEADPHONE) {
          // 구매 완료 후 헤드폰은 24시간 cooldown 시간 필요
          await manager.update(Headphone, item.id, {
            cooldownTime: LocalDateTime.now().plusHours(24),
          });
        }
        if (item.type === ItemType.PINBALLHEAD) {
          await manager.update(User, userId, { role: 'musician' });
        }
      });
      const buyItem = await this.marketplaceUtilService.retrieveItemData(
        item.id
      );
      return buyItem;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchSellSticker(
    pageOptionsDto: PageOptionsDto,
    stickerFilterDto: StickerFilterDto,
    user: User
  ) {
    try {
      const attribute = stickerFilterDto.attribute
        ? stickerFilterDto.attribute
        : [
            Attribute.EFFICIENCY,
            Attribute.LUCK,
            Attribute.COMFORT,
            Attribute.RESILIENCE,
          ];
      const levelLessThen = stickerFilterDto.levelLessThen
        ? Number(stickerFilterDto.levelLessThen)
        : 9999;
      const levelMoreThen = stickerFilterDto.levelMoreThen
        ? Number(stickerFilterDto.levelMoreThen)
        : 0;
      const queryBuilder = this.stickerRepository
        .createQueryBuilder('sticker')
        .leftJoinAndSelect('sticker.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.itemStatus =:itemStatus', {
          itemStatus: ItemStatus.SELLING,
        })
        .andWhere('items.user != :userId', { userId: user.id })
        .andWhere('sticker.attribute IN (:attribute)', { attribute })
        .andWhere('sticker.level <= :levelLessThen', { levelLessThen })
        .andWhere(':levelMoreThen <= sticker.level ', { levelMoreThen });
      queryBuilder
        .orderBy('sales.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto,
      });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchSellPinballHead(pageOptionsDto: PageOptionsDto, user: User) {
    try {
      const queryBuilder = this.pinballheadRepository
        .createQueryBuilder('pinballhead')
        .leftJoinAndSelect('pinballhead.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.itemStatus =:itemStatus', {
          itemStatus: ItemStatus.SELLING,
        })
        .andWhere('items.user != :userId', { userId: user.id });

      queryBuilder
        .orderBy('sales.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto,
      });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }
  async fetchSellHeadphoneOrHeadphoneBox(
    pageOptionsDto: PageOptionsDto,
    filter: HeadphoneOrHeadphoneBoxFilterDto,
    user: User
  ) {
    try {
      const q = filter.quality
        ? filter.quality
        : [
            Quality.UNKNOWN,
            Quality.COMMON,
            Quality.UNCOMMON,
            Quality.RARE,
            Quality.EPIC,
            Quality.LEGENDARY,
          ];
      const llt = filter.levelLessThen ? Number(filter.levelLessThen) : 9999;
      const lmt = filter.levelMoreThen ? Number(filter.levelMoreThen) : -1;
      const mlt = filter.mintLessThen ? Number(filter.mintLessThen) : 9999;
      const mmt = filter.mintMoreThen ? Number(filter.mintMoreThen) : -1;

      if (filter.type === ItemTypeFilter.HEADPHONE) {
        const queryBuilder = this.headphoneRepository
          .createQueryBuilder('headphone')
          .leftJoinAndSelect('headphone.item', 'items')
          .leftJoinAndSelect('items.itemSale', 'sales')
          .where('items.itemStatus =:itemStatus', {
            itemStatus: ItemStatus.SELLING,
          })
          .andWhere('items.user != :userId', { userId: user.id })
          .andWhere('headphone.quality IN (:q)', { q })
          .andWhere('headphone.mintCount < :mlt', { mlt })
          .andWhere(':mmt < headphone.mintCount ', { mmt })
          .andWhere('headphone.level < :llt', { llt })
          .andWhere(':lmt < headphone.level ', { lmt });

        queryBuilder
          .orderBy('sales.updatedAt', pageOptionsDto.order)
          .skip(pageOptionsDto.skip)
          .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({
          itemCount,
          pageOptionsDto,
        });

        return new PageDto(entities, pageMetaDto);
      }
      if (filter.type === ItemTypeFilter.HEADPHONEBOX) {
        const queryBuilder = this.headphoneBoxRepository
          .createQueryBuilder('headphoneBox')
          .leftJoinAndSelect('headphoneBox.item', 'items')
          .leftJoinAndSelect('items.itemSale', 'sales')
          .where('items.itemStatus =:itemStatus', {
            itemStatus: ItemStatus.SELLING,
          })
          .andWhere('items.user != :userId', { userId: user.id })
          .andWhere('headphoneBox.quality IN (:q)', { q });
        queryBuilder
          .orderBy('sales.updatedAt', pageOptionsDto.order)
          .skip(pageOptionsDto.skip)
          .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({
          itemCount,
          pageOptionsDto,
        });

        return new PageDto(entities, pageMetaDto);
      }
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchSellTickets(pageOptionsDto: PageOptionsDto, user: User) {
    try {
      const queryBuilder = this.ticketRepository
        .createQueryBuilder('tickets')
        .leftJoinAndSelect('tickets.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.itemStatus =:itemStatus', {
          itemStatus: ItemStatus.SELLING,
        })
        .andWhere('items.user != :userId', { userId: user.id });

      queryBuilder
        .orderBy('sales.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto,
      });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async fetchSellMerchandise(pageOptionsDto: PageOptionsDto, user: User) {
    try {
      const queryBuilder = this.merchandiseRepository
        .createQueryBuilder('merchandise')
        .leftJoinAndSelect('merchandise.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.itemStatus =:itemStatus', {
          itemStatus: ItemStatus.SELLING,
        })
        .andWhere('items.user != :userId', { userId: user.id });

      queryBuilder
        .orderBy('sales.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto,
      });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }
}
