import { Item, ItemSale } from '@libs/l2e-queries/entities';
import {
  ItemRepository,
  ItemSaleRepository,
} from '@libs/l2e-queries/repositories';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class MarketplaceUtilService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(Item)
    private readonly itemRepository: ItemRepository,
    @InjectRepository(ItemSale)
    private readonly itemSaleRepository: ItemSaleRepository
  ) {}

  async retrieveSellData(itemId: number) {
    try {
      const sale = this.itemSaleRepository
        .createQueryBuilder('itemSale')
        .leftJoinAndSelect('itemSale.item', 'items')
        .where('items.id =:id', {
          id: itemId,
        })
        .getOne();
      return sale;
    } catch (error) {
      this.logger.error('retrieveSellData', error, 'MarketplaceService');
    }
  }
  async retrieveItemData(itemId: number) {
    try {
      const sale = this.itemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.user', 'users')
        .where('item.id =:id', {
          id: itemId,
        })
        .getOne();

      return sale;
    } catch (error) {
      this.logger.error('retrieveItemData', error, 'MarketplaceService');
    }
  }
}
