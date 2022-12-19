import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BigNumber from 'bignumber.js';

import {
  Item,
  Nft,
  SpendingBalance,
  User,
  Withdraw,
} from '@libs/l2e-queries/entities';
import {
  ItemRepository,
  NftRepository,
  SpendingBalanceRepository,
  UserRepository,
  WithdrawRepository,
} from '@libs/l2e-queries/repositories';

import {
  WHITE_LIST_COLLECTION_ADDRESS,
  WHITE_LIST_TOKEN_ADDRESS,
} from '@cores/common-constants';
import {
  convertBigDecimalsValueToNumber,
  getTokenInformation,
} from '@libs/l2e-utils/util-functions';
import {
  ItemStatus,
  ItemType,
  MainNetNetwork,
  WithdrawStatus,
  WithdrawType,
} from '@libs/l2e-queries/dtos';
import { ICreateDepositTokenRecord } from './deposit.interface';
import { TokenInfos } from '@libs/l2e-utils/constants';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @InjectRepository(User) private readonly userRepository: UserRepository,
    @InjectRepository(Nft) private readonly nftRepository: NftRepository,
    @InjectRepository(Item) private readonly itemRepository: ItemRepository,
    @InjectRepository(Withdraw)
    private readonly withdrawRepository: WithdrawRepository
  ) {}

  // TODO: 입금 프로세스 개선 필요
  public async depositToken(event) {
    try {
      const { userId, token, amount } = event.returnValues;
      if (!WHITE_LIST_TOKEN_ADDRESS.includes(token.toLowerCase())) {
        throw new Error('Token is not in the white list');
      }
      const user: User = await this.userRepository.findOneBy({
        id: userId,
      });
      if (!user) {
        throw new Error('User does not exist');
      }
      const { tokenSymbol, tokenDecimals } = await getTokenInformation(token);
      const amountBigNumber = await convertBigDecimalsValueToNumber(
        amount,
        tokenDecimals
      );
      const spendingBalance: SpendingBalance =
        await this.spendingBalanceRepository.findOne({
          where: {
            owner: user.id,
            tokenAddress: token.toLowerCase(),
          },
        });
      if (!spendingBalance) {
        // TODO: 소수점 확인 후 리팩토링
        // create a plus spending balance
        const createdSpendingBalance: SpendingBalance =
          await this.spendingBalanceRepository.create({
            tokenSymbol,
            tokenDecimals,
            network: MainNetNetwork.BSC, // TODO: get network from config or from event
            balance: new BigNumber(amountBigNumber).toNumber(),
            availableBalance: new BigNumber(amountBigNumber).toNumber(),
            owner: userId,
            tokenAddress: token.toLocaleLowerCase(),
          });
        await createdSpendingBalance.save();
      } else {
        spendingBalance.balance = new BigNumber(spendingBalance.balance)
          .plus(amountBigNumber)
          .toNumber();
        spendingBalance.availableBalance = new BigNumber(
          spendingBalance.availableBalance
        )
          .plus(amountBigNumber)
          .toNumber();
        await spendingBalance.save();
      }
      // await this.updateTxHistories(event.transactionHash);

      await this.createDepositRecord({
        userId,
        tokenAddress: token.toLowerCase(),
        amountWithdraw: new BigNumber(amountBigNumber),
        walletAddress: user.walletAddress,
      });
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  // TODO: 입금 프로세스 개선 필요
  public async depositNft(event) {
    try {
      const { collection, tokenId, userId } = event.returnValues;
      if (!WHITE_LIST_COLLECTION_ADDRESS.includes(collection.toLowerCase())) {
        throw new Error('Collection is not in the white list');
      }

      const nft: Nft = await this.nftRepository.findOneBy({
        collectionAddress: collection.toLowerCase(),
        tokenId: +tokenId,
      });

      if (!nft) throw new Error('Nft does not exist');

      const user: User = await this.userRepository.findOneBy({
        id: userId,
      });

      if (!user) throw new Error('User does not exist');

      nft.owner = user;
      nft.isLock = 0;
      nft.network = MainNetNetwork.BSC;
      await nft.save();

      const item: Item = await this.itemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.nft', 'nft')
        .where('nft.id = :id', { id: nft.id })
        .getOne();

      item.user = user;
      if (item.type === ItemType.HEADPHONE) {
        item.itemStatus = ItemStatus.IDLE;
      } else if (item.type === ItemType.HEADPHONEBOX) {
        item.itemStatus = ItemStatus.NOT_OPENED;
      }

      await item.save();
      // await this.updateTxHistories(event.transactionHash);

      await this.createDepositRecord({
        userId,
        nftId: nft.id,
        tokenId,
        collectionAddress: collection.toLowerCase(),
        walletAddress: user.walletAddress,
      });
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  // TODO: history 모듈 생성 시 맞춰서 같이 수정 필요
  private async createDepositRecord({
    tokenAddress,
    collectionAddress,
    amountWithdraw,
    userId,
    walletAddress,
    tokenId,
    nftId,
  }: ICreateDepositTokenRecord): Promise<Withdraw> {
    const deposit = new Withdraw();

    if (tokenAddress) {
      deposit.type = WithdrawType.TOKEN;
      deposit.tokenAddress = tokenAddress;
      deposit.amount = amountWithdraw?.toString();
    } else {
      deposit.type = WithdrawType.NFT;
      deposit.collectionAddress = collectionAddress;
      deposit.nftId = nftId;
      deposit.tokenId = tokenId;
    }

    deposit.mainWallet = walletAddress;
    deposit.userId = userId;
    deposit.status = WithdrawStatus.SUCCESS;
    deposit.category = 'DEPOSIT';

    console.log('deposit', deposit);
    await this.withdrawRepository.save(deposit);

    return deposit;
  }
}
