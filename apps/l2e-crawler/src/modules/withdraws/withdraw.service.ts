import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

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

import { TokenInfos } from '@libs/l2e-utils/constants';
import {
  sendTransferNftTransaction,
  getTransactionReceipt,
  sendTransferTokenTransaction,
  mintNftTransaction,
} from '@libs/l2e-utils/util-functions';
import BigNumber from 'bignumber.js';
import { DataSource, EntityManager } from 'typeorm';
import { WithdrawStatus, WithdrawType } from '@libs/l2e-queries/dtos';

@Injectable()
export class WithdrawService {
  private readonly adminWallet: string;
  private readonly adminPrivateKey: string;
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @InjectRepository(User) private readonly userRepository: UserRepository,
    @InjectRepository(Item) private readonly itemRepository: ItemRepository,
    @InjectRepository(Nft) private readonly nftRepository: NftRepository,
    @InjectRepository(Withdraw)
    private readonly withdrawRepository: WithdrawRepository,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {
    this.adminWallet = process.env.ADMIN_WALLET_ADDRESS;
    this.adminPrivateKey = process.env.ADMIN_WALLET_PRIVATEKEY;
  }

  async handleRequestWithDrawToken() {
    try {
      const withdrawNftRequests = await this.withdrawRepository.findOneBy({
        status: WithdrawStatus.PENDING,
        type: WithdrawType.TOKEN,
      });

      if (!withdrawNftRequests) return;

      const { tokenAddress, amount, mainWallet } = withdrawNftRequests;

      const txResult = await sendTransferTokenTransaction(
        this.adminWallet,
        mainWallet,
        tokenAddress,
        amount,
        this.adminPrivateKey
      );

      // update status withdraw
      if (txResult) {
        await this.updateWithDrawStatusToProcessing(
          withdrawNftRequests,
          txResult.transactionHash
        );
        return txResult;
      }

      return;
    } catch (error) {
      if (error.message === 'Returned error: already known') {
        console.log(error.message);
      }
    }
  }

  async handleRequestWithDrawNft() {
    const withdrawNftRequests = await this.withdrawRepository.findOneBy({
      status: WithdrawStatus.PENDING,
      type: WithdrawType.NFT,
    });

    if (!withdrawNftRequests) return;

    // handle transfer nft
    const { mainWallet, collectionAddress, tokenId, nftId } =
      withdrawNftRequests;

    try {
      let txResult;
      // NFT??? mint ??? ?????? ?????? ??????, tokenId??? ??????. transfer ?????? ??????
      if (tokenId) {
        txResult = await sendTransferNftTransaction(
          this.adminWallet,
          mainWallet,
          collectionAddress,
          tokenId,
          this.adminPrivateKey
        );
      }
      // NFT??? mint ??? ?????? ?????? ??????, tokenId??? ???????????? ??????. mint ?????? ??????
      else if (!withdrawNftRequests.txHash) {
        txResult = await mintNftTransaction(
          this.adminWallet,
          mainWallet,
          collectionAddress,
          this.adminPrivateKey
        );
      }

      // update status withdraw
      if (txResult) {
        await this.updateWithDrawStatusToProcessing(
          withdrawNftRequests,
          txResult.transactionHash
        );
        return txResult;
      }

      return;
    } catch (error) {
      this.logger.error(
        `NFT ID: ${nftId} withdraw ERROR \n ${error}`,
        'handleRequestWithDrawNft'
      );
    }
  }

  async checkWithdrawTransaction() {
    const withdrawNftRequests = await this.withdrawRepository
      .createQueryBuilder('withdraw')
      .where('withdraw.status IN (:status)', {
        status: [
          WithdrawStatus.TRANSFER_PROCESSING,
          WithdrawStatus.MINT_PROCESSING,
        ],
      })
      .getOne();

    if (!withdrawNftRequests) return;

    // transaction with dataSource
    try {
      const transactionReceipt = await getTransactionReceipt(
        withdrawNftRequests.txHash
      );
      await this.dataSource.transaction(async (manager) => {
        const {
          userId,
          tokenAddress,
          amount,
          tokenId,
          collectionAddress,
          type,
          nftId,
        } = withdrawNftRequests;

        if (transactionReceipt.status) {
          switch (type) {
            case WithdrawType.TOKEN:
              {
                await this.updateSpendingBalanceAfterWithDrawTokenSuccess(
                  userId,
                  tokenAddress,
                  amount,
                  manager
                );

                withdrawNftRequests.status = WithdrawStatus.SUCCESS;
                await manager.save(withdrawNftRequests);
              }
              break;

            case WithdrawType.NFT:
              {
                // withdraw status??? ?????? ???????????? ?????? ?????? ??? ??????
                await this.updateNftAfterTransferOrMintNftSuccess(
                  collectionAddress,
                  tokenId,
                  nftId,
                  transactionReceipt,
                  withdrawNftRequests,
                  manager
                );
              }
              break;

            default:
              throw new NotAcceptableException('Invalid withdraw type');
          }
        } else {
          this.checkFailStatus(
            type,
            tokenAddress,
            tokenId,
            withdrawNftRequests
          );
        }

        // await manager.save(withdrawNftRequests);
      });
    } catch (error) {
      this.logger.error(
        `NFT ID: ${withdrawNftRequests.nftId} withdraw ERROR \n ${error}`,
        'checkWithdrawTransaction'
      );
      // TODO: exceptionHandler ?????????
      // exceptionHandler(error);
    }
  }

  /**
   * @description: ?????? ????????? ?????????. ?????? ????????? ????????? ?????? ????????? ?????????.
   */

  private checkFailStatus(
    type: string,
    tokenAddress: string,
    tokenId: number,
    withdrawNftRequests: Withdraw
  ) {
    switch (type) {
      case WithdrawType.TOKEN:
        if ([TokenInfos.BNB.address].includes(tokenAddress)) {
          withdrawNftRequests.status = WithdrawStatus.TRANSFER_FAILED;
        } else if (
          [TokenInfos.LBL.address, TokenInfos.BLB.address].includes(
            tokenAddress
          )
        ) {
          withdrawNftRequests.status = WithdrawStatus.MINT_FAILED;
        }
        break;
      case WithdrawType.NFT:
        if (tokenId) {
          withdrawNftRequests.status = WithdrawStatus.TRANSFER_FAILED;
        } else {
          withdrawNftRequests.status = WithdrawStatus.MINT_FAILED;
        }
        break;
      default:
        this.logger.error(
          `NFT ID: ${withdrawNftRequests.nftId} withdraw ERROR when checkFailStatus`,
          'checkWithdrawTransaction'
        );
        break;
    }
  }

  async updateWithDrawStatusToProcessing(
    withdraw: Withdraw,
    txHash: string
  ): Promise<void> {
    withdraw.txHash = txHash;

    if (withdraw.type === WithdrawType.TOKEN) {
      switch (withdraw.tokenAddress) {
        case TokenInfos.BNB.address:
          withdraw.status = WithdrawStatus.TRANSFER_PROCESSING;
          break;
        // TODO: LBL ?????? ?????? ?????? ??? ?????? ??????
        case TokenInfos.LBL.address:
          withdraw.status = WithdrawStatus.TRANSFER_PROCESSING;
          break;
        case TokenInfos.BLB.address:
          withdraw.status = WithdrawStatus.MINT_PROCESSING;
          break;
        default:
          throw new BadRequestException('Invalid collection address');
      }
    } else if (withdraw.type === WithdrawType.NFT) {
      // tokenId??? ???????????? transfer, ???????????? ????????? mint
      if (withdraw.tokenId) {
        withdraw.status = WithdrawStatus.TRANSFER_PROCESSING;
      } else {
        withdraw.status = WithdrawStatus.MINT_PROCESSING;
      }
    }

    await withdraw.save();
  }

  async updateSpendingBalanceAfterWithDrawTokenSuccess(
    owner: number,
    tokenAddress: string,
    amount: string,
    manager: EntityManager
  ) {
    const spendingBalances = await this.spendingBalanceRepository.findOneBy({
      owner,
      tokenAddress,
    });
    if (!spendingBalances) return;

    spendingBalances.balance = new BigNumber(spendingBalances.balance)
      .minus(amount)
      .toNumber();
    await manager.save(spendingBalances);
  }

  async updateNftAfterTransferOrMintNftSuccess(
    collectionAddress: string,
    tokenId: number,
    nftId: number,
    transactionReceipt: any,
    withdrawNftRequests: Withdraw,
    manager: EntityManager
  ) {
    // tokenId??? ?????? ??????(?????? ????????? ?????? ??????) owner ????????? ????????????
    if (tokenId) {
      const nft = await this.nftRepository.findOneBy({
        collectionAddress,
        tokenId,
      });

      nft.owner = null;
      await manager.save(nft);

      withdrawNftRequests.status = WithdrawStatus.SUCCESS;

      await manager.save(withdrawNftRequests);
    }
    // tokenId??? ?????? ??????(?????? ????????? ??????) tokenId ????????? ????????????
    else {
      // TODO: ?????? ????????? mint ??????????????? 1?????? ????????? ??????. ????????? ?????????, ???????????? ????????? ????????? ???????????? ?????? ??????
      const hexData = transactionReceipt.logs[0].topics[3];
      // hex to int
      const tokenId = parseInt(hexData, 16);
      const nft = await this.nftRepository.findOneBy({
        collectionAddress,
        id: nftId,
      });

      nft.tokenId = tokenId;
      nft.owner = null;
      await manager.save(nft);

      withdrawNftRequests.tokenId = tokenId;
      withdrawNftRequests.status = WithdrawStatus.PENDING;

      await manager.save(withdrawNftRequests);
    }
  }
}
