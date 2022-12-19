import {
  DockStatus,
  ItemStatus,
  ItemType,
  TradeType,
} from '@libs/l2e-queries/dtos';
import {
  Headphone,
  HeadphoneDock,
  Item,
  Nft,
} from '@libs/l2e-queries/entities';
import {
  HeadphoneDockRepository,
  HeadphoneRepository,
} from '@libs/l2e-queries/repositories';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

interface TypeForPolicy {
  afterCancel: () => Item;
  afterBuy: () => Item;
  toLeveling: () => Item;
  toIdle: () => Item;
  toListening: () => Item;
  toOpened: () => Item;
  toWithdraw: () => Item;
}

enum ApplyType {
  TRADE,
  USER_ACTION,
  WITHDRAW,
}

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(HeadphoneDock)
    private readonly headphoneDockRepository: HeadphoneDockRepository,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository
  ) {}
  private _item: Item;
  private _tradeType: TradeType;
  private _targetStatus: ItemStatus;

  async validationCheckForSellBy(item: Item) {
    let isValid = true;
    switch (item.type) {
      case ItemType.HEADPHONE: {
        /**
         * headphone is not for sale if its battery is not full
         * headphone is not for sale if its one of docks' status is INSERTED
         */
        const headphoneDocks = await this.headphoneDockRepository
          .createQueryBuilder()
          .where('headphone_id = :headphoneId', { headphoneId: item.id })
          .getMany();
        const headphone = await this.headphoneRepository
          .createQueryBuilder()
          .where('item_id = :id', { id: item.id })
          .getOne();
        if (
          headphoneDocks.find(
            (headphoneDock) => headphoneDock.dockStatus === DockStatus.INSERTED
          ) ||
          headphone.battery !== 100 ||
          item.itemStatus !== ItemStatus.IDLE
        ) {
          isValid = false;
        }
        break;
      }
      case ItemType.HEADPHONEBOX:
        if (item.itemStatus !== ItemStatus.NOT_OPENED) {
          isValid = false;
        }
        break;
      case ItemType.STICKER:
        if (item.itemStatus !== ItemStatus.NOT_INSERTED) {
          isValid = false;
        }
        break;
      case ItemType.PINBALLHEAD:
        if (item.itemStatus === ItemStatus.SELLING) {
          isValid = false;
        }
        break;

      default:
        break;
    }

    if (!isValid)
      throw new NotAcceptableException('item is not available for sale');
  }

  validationCheckForInsertStickerWith(item: Item) {
    // TODO:  스티커 부착 가능한 상태 업데이트
    let isValid = true;
    switch (item.type) {
      case ItemType.HEADPHONE:
        if (
          item.itemStatus !== ItemStatus.IDLE &&
          item.itemStatus !== ItemStatus.COOLDOWN
        ) {
          isValid = false;
        }
        break;
      case ItemType.STICKER:
        if (item.itemStatus !== ItemStatus.NOT_INSERTED) {
          isValid = false;
        }
        break;

      default:
        break;
    }

    if (!isValid)
      throw new NotAcceptableException(
        'headphone/sticker is not available for inserting'
      );
  }

  validationCheckForRemoveStickerFromDockWith(item: Item) {
    // TODO:  스티커 제거 가능한 상태 업데이트
    let isValid = true;
    switch (item.type) {
      case ItemType.HEADPHONE:
        if (
          item.itemStatus !== ItemStatus.IDLE &&
          item.itemStatus !== ItemStatus.COOLDOWN
        ) {
          isValid = false;
        }
        break;
      case ItemType.STICKER:
        if (item.itemStatus !== ItemStatus.INSERTED) {
          isValid = false;
        }
        break;

      default:
        break;
    }

    if (!isValid)
      throw new NotAcceptableException(
        'headphone/sticker is not available for inserting'
      );
  }

  validationCheckForHeadphoneDockForInsertStickerWith(
    headphoneDock: HeadphoneDock
  ) {
    let isValid = true;
    if (headphoneDock.dockStatus !== DockStatus.OPENED) {
      isValid = false;
    }
    if (!isValid)
      throw new NotAcceptableException(
        'headphoneDock is not available for inserting'
      );
  }

  validationCheckForEnhanceStickersWith(
    stickerOneItem: Item,
    stickerTwoItem: Item,
    stickerThreeItem: Item
  ) {
    let isValid = true;
    if (stickerOneItem.itemStatus !== ItemStatus.NOT_INSERTED) {
      isValid = false;
    }
    if (stickerTwoItem.itemStatus !== ItemStatus.NOT_INSERTED) {
      isValid = false;
    }
    if (stickerThreeItem.itemStatus !== ItemStatus.NOT_INSERTED) {
      isValid = false;
    }

    if (!isValid)
      throw new NotAcceptableException(
        'sticker is not available for enhancing'
      );
  }

  updateItemStatus(item: Item): TypeForPolicy {
    this._item = item;
    return this;
  }

  toLeveling(): Item {
    this._targetStatus = ItemStatus.LEVELING;
    return this.apply(ApplyType.USER_ACTION);
  }

  toIdle(): Item {
    this._targetStatus = ItemStatus.IDLE;
    return this.apply(ApplyType.USER_ACTION);
  }

  toListening(): Item {
    this._targetStatus = ItemStatus.LISTENING;
    return this.apply(ApplyType.USER_ACTION);
  }

  toOpened(): Item {
    this._targetStatus = ItemStatus.OPENED;
    return this.apply(ApplyType.USER_ACTION);
  }

  afterCancel(): Item {
    this._tradeType = TradeType.REVOKE;
    return this.apply(ApplyType.TRADE);
  }

  afterBuy(): Item {
    this._tradeType = TradeType.SOLD;
    return this.apply(ApplyType.TRADE);
  }

  toWithdraw(): Item {
    this._targetStatus = ItemStatus.WITHDRAWN;
    return this.apply(ApplyType.WITHDRAW);
  }

  protected apply(applyType: ApplyType): Item {
    switch (applyType) {
      case ApplyType.USER_ACTION:
        return this.applyForUserAction();
      case ApplyType.TRADE:
        return this.applyForTrade();
      case ApplyType.WITHDRAW:
        return this.applyForWithdraw();
      default:
        throw new BadRequestException('invalid apply type');
    }
  }
  protected applyForWithdraw(): Item {
    let isValid = true;
    // mint가 안된 경우에는 nft 정보가 없음
    const isNftLock = (this._item.nft as Nft)?.isLock;

    switch (this._item.type) {
      case ItemType.HEADPHONE:
        if (this._item.itemStatus !== ItemStatus.IDLE || isNftLock === 1) {
          isValid = false;
        }
        break;
      case ItemType.HEADPHONEBOX:
        if (
          this._item.itemStatus !== ItemStatus.NOT_OPENED ||
          isNftLock === 1
        ) {
          isValid = false;
        }
        break;
      case ItemType.STICKER:
        if (
          this._item.itemStatus !== ItemStatus.NOT_INSERTED ||
          isNftLock === 1
        ) {
          isValid = false;
        }
        break;
      case ItemType.PINBALLHEAD:
        if (this._item.itemStatus === ItemStatus.SELLING || isNftLock === 1) {
          isValid = false;
        }
        break;
      default:
        isValid = false;
        break;
    }

    if (!isValid)
      throw new NotAcceptableException('item is not available for withdrawal');

    return this._item;
  }

  protected applyForUserAction() {
    switch (this._item.type) {
      case ItemType.HEADPHONE:
        return this.applyForHeadphoneUserAction();
      case ItemType.HEADPHONEBOX:
        return this.applyForHeadphoneBoxUserAction();
      case ItemType.STICKER:
        return this.applyForStickerUserAction();
      case ItemType.PINBALLHEAD:
        return this.applyForPinballheadUserAction();

      default:
        break;
    }
  }

  protected applyForTrade(): Item {
    if (this._tradeType === TradeType.REVOKE) {
      switch (this._item.type) {
        case ItemType.HEADPHONE:
        case ItemType.PINBALLHEAD:
          this._item.itemStatus = ItemStatus.IDLE;
          break;
        case ItemType.STICKER:
          this._item.itemStatus = ItemStatus.NOT_INSERTED;
          break;
        case ItemType.HEADPHONEBOX:
          this._item.itemStatus = ItemStatus.NOT_OPENED;
          break;
        case ItemType.TICKET || ItemType.MERCHANDISE:
            this._item.itemStatus = ItemStatus.IDLE;
          break;
        default:
          break;
      }

      return this._item;
    }

    switch (this._item.type) {
      case ItemType.HEADPHONE:
        this._item.itemStatus = ItemStatus.COOLDOWN;
        break;
      case ItemType.STICKER:
        this._item.itemStatus = ItemStatus.NOT_INSERTED;
        break;
      case ItemType.HEADPHONEBOX:
        this._item.itemStatus = ItemStatus.NOT_OPENED;
        break;
      case ItemType.PINBALLHEAD:
        this._item.itemStatus = ItemStatus.IDLE;
        break;
      case ItemType.TICKET:
        this._item.itemStatus = ItemStatus.IDLE;
        break;
      case ItemType.MERCHANDISE:
        this._item.itemStatus = ItemStatus.IDLE;
        break;

      default:
        break;
    }
    return this._item;
  }

  protected applyForHeadphoneUserAction(): Item {
    // 헤드폰 상태 변경 가능한 상태는 아래와 같다.
    let result = false;
    if (
      this._item.itemStatus === ItemStatus.IDLE &&
      (this._targetStatus === ItemStatus.COOLDOWN ||
        this._targetStatus === ItemStatus.LEVELING ||
        this._targetStatus === ItemStatus.LISTENING ||
        this._targetStatus === ItemStatus.SELLING)
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.LISTENING &&
      this._targetStatus === ItemStatus.IDLE
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.COOLDOWN &&
      this._targetStatus === ItemStatus.IDLE
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.LEVELING &&
      this._targetStatus === ItemStatus.IDLE
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.SELLING &&
      (this._targetStatus === ItemStatus.IDLE ||
        this._targetStatus === ItemStatus.COOLDOWN)
    ) {
      result = true;
    }
    if (!result)
      throw new BadRequestException(
        'Bad Request for update status of a Headphone'
      );
    return this._item;
  }

  protected applyForHeadphoneBoxUserAction(): Item {
    let result = false;
    if (
      this._item.itemStatus === ItemStatus.NOT_OPENED &&
      this._targetStatus === (ItemStatus.OPENED || ItemStatus.SELLING)
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.SELLING &&
      this._targetStatus === ItemStatus.NOT_OPENED
    ) {
      result = true;
    }

    if (!result)
      throw new BadRequestException(
        'Bad Request for update status of a HeadphoneBox'
      );
    return this._item;
  }

  protected applyForStickerUserAction(): Item {
    let result = false;
    if (
      this._item.itemStatus === ItemStatus.NOT_INSERTED &&
      (this._targetStatus === ItemStatus.INSERTED ||
        this._targetStatus === ItemStatus.SELLING)
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.INSERTED &&
      this._targetStatus === ItemStatus.NOT_INSERTED
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.SELLING &&
      this._targetStatus === ItemStatus.NOT_INSERTED
    ) {
      result = true;
    }

    if (!result)
      throw new BadRequestException(
        'Bad Request for update status of a Sticker'
      );
    return this._item;
  }

  protected applyForPinballheadUserAction(): Item {
    let result = false;
    if (
      this._item.itemStatus === null &&
      this._targetStatus === ItemStatus.SELLING
    ) {
      result = true;
    }

    if (
      this._item.itemStatus === ItemStatus.SELLING &&
      this._targetStatus === null
    ) {
      result = true;
    }

    if (!result)
      throw new BadRequestException(
        'Bad Request for update status of a Pinballhead'
      );
    return this._item;
  }
}
