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
  CreatePinballheadDto,
  UpdatePinballheadDto,
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

@Injectable()
export class PinballheadsService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(INVENTORIES_CONFIG_OPTIONS)
    private readonly options: InventoriesModuleOptions,
    @Inject(InventoriesFormulaService)
    private readonly inventoriesFormula: InventoriesFormulaService,
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

  async createPinballhead(createPinballheadDto: CreatePinballheadDto) {
    let createdPinballhead: Pinballhead;

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          // create item
          // TODO: imgURL 동적으로 입력 받아야 함 또는 생성 필요
          const newItem = this.itemRepository.create({
            // TODO: ADMIN_USER_ID는 별도로 주입해서 설정 필요
            user: +process.env.ADMIN_USER_ID, //admin id
            imgUrl: createPinballheadDto.imgUrl,
            type: ItemType.PINBALLHEAD,
            itemStatus: null,
          });

          const item = await manager.save(newItem);

          // create pinballhead
          const newPinballhead = this.pinballheadRepository.create({
            item: item.id,
            description: createPinballheadDto.description,
          });

          createdPinballhead = await manager.save(newPinballhead);
        });

      return createdPinballhead;
    } catch (error) {
      this.logger.error(
        error,
        `createPinballhead(${createPinballheadDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveAllPinballheadsByUserId(
    userId: number,
    pageOptionsDto: PageOptionsDto
  ) {
    try {
      const queryBuilder = this.pinballheadRepository
        .createQueryBuilder('pinballhead')
        .leftJoinAndSelect('pinballhead.item', 'items')
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
        `retrieveAllPinballheadsByUserId(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async retrievePinballheadDetailByItemId(itemId: number) {
    try {
      const result = await this.pinballheadRepository
        .createQueryBuilder('pinballhead')
        .leftJoinAndSelect('pinballhead.item', 'items')
        .leftJoinAndSelect('items.itemSale', 'sales')
        .where('items.id = :itemId', { itemId: itemId })
        .getOne();

      if (!result) {
        throw new NotFoundException('Pinballhead not found');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      this.logger.error(
        error,
        `retrievePinballheadDetailByUserIdAndItemId(${itemId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async updatePinballhead(updatePinballheadDto: UpdatePinballheadDto) {
    const item = await this.itemRepository.findOneBy({
      id: updatePinballheadDto.id,
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const pinballhead = await this.pinballheadRepository.findOneBy({
      item: updatePinballheadDto.id,
    });
    if (!pinballhead) {
      throw new NotFoundException('Pinballhead not found');
    }

    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          if (updatePinballheadDto.item) {
            const updateItem = this.itemRepository.create(
              updatePinballheadDto.item
            );
            await manager.update(Item, updatePinballheadDto.id, updateItem);
          }

          if (updatePinballheadDto.pinballhead) {
            const updatePinballhead = this.pinballheadRepository.create(
              updatePinballheadDto.pinballhead
            );
            await manager.update(
              Pinballhead,
              updatePinballheadDto.id,
              updatePinballhead
            );
          }
        });

      return { result: 'Success to update Pinballhead' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      this.logger.error(
        error,
        `updatePinballhead(${updatePinballheadDto})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  async deletePinballhead(pinballheadId: number) {
    const item = await this.itemRepository.findOneBy({ id: pinballheadId });
    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    const pinballhead = await this.pinballheadRepository.findOneBy({
      item: pinballheadId,
    });
    if (!pinballhead) {
      throw new HttpException('Pinballhead not found', HttpStatus.NOT_FOUND);
    }

    try {
      // pinballhead, item 삭제
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          await manager.remove(pinballhead);
          await manager.remove(item);
        });

      return { result: 'Success to delete Pinballhead' };
    } catch (error) {
      this.logger.error(
        error,
        `deletePinballhead(${pinballheadId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }
}
