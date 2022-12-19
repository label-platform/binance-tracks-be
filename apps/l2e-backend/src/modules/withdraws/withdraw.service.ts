import {
  CreateWithdrawNftDto,
  CreateWithdrawTokenDto,
  ItemStatus,
  MainNetNetwork,
  TokenSymbol,
  WithdrawHistoriesFilterDto,
  WithdrawStatus,
  WithdrawType,
} from '@libs/l2e-queries/dtos';
import {
  Item,
  Nft,
  SpendingBalance,
  User,
  Withdraw,
} from '@libs/l2e-queries/entities';
import {
  SpendingBalanceRepository,
  NftRepository,
  ItemRepository,
  WithdrawRepository,
} from '@libs/l2e-queries/repositories';
import { TokenInfos } from '@libs/l2e-utils/constants';
import { checkSignedMessage } from '@libs/l2e-utils/util-functions';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import BigNumber from 'bignumber.js';
import { SIGNED_MESSAGE_TO_WITHDRAW } from '@withdraws/withdraw.constant';
import {
  ICreateWithDrawnTokenRecord,
  IUpdateWithdrawnTokenBalance,
} from '@withdraws/withdraw.interface';
import { DataSource } from 'typeorm';
import { PoliciesService } from '../policies/policies.service';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import { exceptionHandler } from '@src/common/exception-handler';

@Injectable()
export class WithdrawService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(PoliciesService)
    private readonly policiesService: PoliciesService,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @InjectRepository(Nft)
    private readonly nftRepository: NftRepository,
    @InjectRepository(Item)
    private readonly itemRepository: ItemRepository,
    @InjectRepository(Withdraw)
    private readonly withdrawRepository: WithdrawRepository,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async withdrawTokenToMainWallet(
    createWithdrawTokenDto: CreateWithdrawTokenDto,
    user: User
  ): Promise<Withdraw> {
    const { tokenSymbol, amount, signedMessage } = createWithdrawTokenDto;
    const { walletAddress, id: userId } = user;

    // verify signature
    // await this.verifySignatureToWithDraw(signedMessage, walletAddress);

    // verify withdraw token balance
    const tokenAddress = TokenInfos[tokenSymbol].address;
    const spendingBalanceBeWithdrawn =
      await this.spendingBalanceRepository.findOneBy({
        owner: userId,
        tokenAddress,
      });

    if (!spendingBalanceBeWithdrawn) {
      throw new HttpException(
        'Invalid spending balance to withdraw. Please try again',
        HttpStatus.NOT_FOUND
      );
    }

    const amountWithdraw = new BigNumber(amount);
    const availableBalance = new BigNumber(
      spendingBalanceBeWithdrawn.availableBalance
    );

    if (amountWithdraw.isGreaterThan(availableBalance)) {
      throw new HttpException(
        'Insufficient balance to withdraw. Please try again',
        HttpStatus.BAD_REQUEST
      );
    }

    // TODO: 현 시점에서는 필요없음. 추후 admin wallet 가스비 체크 용도로 활용 가능
    // const { gasLimit, nativeSpendingBalance } = await this.verifyNativeBalance({
    //   userId,
    //   walletAddress,
    //   tokenAddress,
    //   amount,
    // });

    // create withdraw request
    let withdraw;
    try {
      await this.dataSource.manager.transaction(async (manager) => {
        await this.payWithdrawalFee(userId, WithdrawType.TOKEN, manager);

        withdraw = await this.createWithdrawRecord({
          tokenAddress,
          amountWithdraw,
          userId,
          walletAddress,
          manager,
        });

        // TODO: 현 시점에서는 필요없음. 추후 admin wallet 가스비 체크 용도로 활용 가능
        // update balance after withdraw request
        // await this.updateNativeBalance({ gasLimit, nativeSpendingBalance });

        // BLB일 경우에 출금 수수료를 추가
        if (tokenSymbol === TokenSymbol.BLB) {
          await this.updateWithdrawnTokenBalance({
            amountWithdraw: amountWithdraw.plus(
              new BigNumber(+process.env.TOKEN_WITHDRAW_BLB_FEE)
            ),
            spendingBalanceBeWithdrawn,
            manager,
          });
        } else {
          await this.updateWithdrawnTokenBalance({
            amountWithdraw,
            spendingBalanceBeWithdrawn,
            manager,
          });
        }
      });
    } catch (error) {
      this.logger.error(
        `[withdrawTokenToMainWallet] userId: ${userId} \n ${error.message}`
      );
      throw new HttpException(
        'Create withdraw request failed. Please try again',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return withdraw;
  }

  async verifySignatureToWithDraw(
    signedMessage: string,
    walletAddress: string
  ): Promise<void> {
    let checkSignedMessageResult;
    try {
      checkSignedMessageResult = checkSignedMessage(
        SIGNED_MESSAGE_TO_WITHDRAW,
        signedMessage,
        walletAddress
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!checkSignedMessageResult) {
      throw new HttpException(
        'Invalid signedMessage to withdraw. Please verify your wallet address',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async updateWithdrawnTokenBalance({
    amountWithdraw,
    spendingBalanceBeWithdrawn,
    manager,
  }: IUpdateWithdrawnTokenBalance): Promise<void> {
    // TODO: 출금 시 토큰 별 소수점 입력 어떻게 할지에 따라 수정 필요
    spendingBalanceBeWithdrawn.availableBalance = new BigNumber(
      spendingBalanceBeWithdrawn.availableBalance
    )
      .minus(amountWithdraw)
      .toNumber();
    await manager.save(spendingBalanceBeWithdrawn);
  }

  async createWithdrawRecord({
    tokenAddress,
    amountWithdraw,
    userId,
    walletAddress,
    tokenId,
    itemType,
    nftId,
    manager,
  }: ICreateWithDrawnTokenRecord): Promise<Withdraw> {
    const withdraw = new Withdraw();

    if (tokenAddress) {
      withdraw.type = WithdrawType.TOKEN;
      withdraw.tokenAddress = tokenAddress;
      withdraw.amount = amountWithdraw?.toString();
    } else {
      withdraw.type = WithdrawType.NFT;
      withdraw.collectionAddress = TokenInfos[itemType].address;
      withdraw.nftId = nftId;
      withdraw.tokenId = tokenId;
    }

    withdraw.mainWallet = walletAddress;
    withdraw.userId = userId;
    withdraw.status = WithdrawStatus.PENDING;
    withdraw.category = 'WITHDRAW';
    await manager.save(withdraw);

    return withdraw;
  }

  async withdrawNftToMainWallet(
    createWithdrawNftDto: CreateWithdrawNftDto,
    user: User
  ): Promise<Withdraw> {
    const { itemType, itemId, signedMessage } = createWithdrawNftDto;
    const { walletAddress, id: userId } = user;
    // verify signature
    // await this.verifySignatureToWithDraw(signedMessage, walletAddress);

    // verify owner item
    const itemBeWithdrawn = await this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.nft', 'nfts')
      .where('item.id = :itemId', { itemId })
      .andWhere('item.user = :userId', { userId })
      .andWhere('item.type = :itemType', { itemType })
      .getOne();

    if (!itemBeWithdrawn) {
      throw new HttpException(
        'Invalid item to withdraw. Please try again',
        HttpStatus.NOT_FOUND
      );
    }

    this.policiesService.updateItemStatus(itemBeWithdrawn).toWithdraw();

    // TODO: 현 시점에서는 필요없음. 추후 admin wallet 가스비 체크 용도로 활용 가능
    // verify native token
    // const { gasLimit, nativeSpendingBalance } = await this.verifyNativeBalance({
    //   userId,
    //   walletAddress,
    //   collectionAddress,
    //   tokenId,
    // });

    // create withdraw request
    let withdraw: Withdraw;
    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          await this.payWithdrawalFee(userId, WithdrawType.NFT, manager);

          // TODO: 현 시점에서는 필요없음. 추후 admin wallet 가스비 체크 용도로 활용 가능
          // update native balance after withdraw request
          // await this.updateNativeBalance({ gasLimit, nativeSpendingBalance });

          // NFT가 mint 된 적이 없는 경우, nft 정보 생성 및 item update
          let nftId: number;
          if (!itemBeWithdrawn.nft) {
            const nftBeWithdrawnEntity = this.nftRepository.create({
              collectionAddress: TokenInfos[itemType].address,
              network: MainNetNetwork.BSC,
              isLock: 1,
              owner: userId,
            });
            const nftBeWithdrawn = await manager.save(nftBeWithdrawnEntity);
            nftId = nftBeWithdrawn.id;

            const updateItemEntity = this.itemRepository.create({
              ...itemBeWithdrawn,
              nft: nftBeWithdrawn,
              itemStatus: ItemStatus.WITHDRAWN,
            });

            await manager.save(updateItemEntity);

            withdraw = await this.createWithdrawRecord({
              userId,
              walletAddress,
              itemType,
              nftId,
              manager,
            });
          }
          // NFT가 mint 된 적이 있는 경우, nft lock 설정 및 item update
          else {
            nftId = (itemBeWithdrawn.nft as Nft).id;
            const nftBeWithdrawnEntity = this.nftRepository.create({
              id: nftId,
              isLock: 1,
              owner: userId,
            });
            await manager.save(nftBeWithdrawnEntity);

            const updateItemEntity = this.itemRepository.create({
              ...itemBeWithdrawn,
              itemStatus: ItemStatus.WITHDRAWN,
            });

            await manager.save(updateItemEntity);

            withdraw = await this.createWithdrawRecord({
              userId,
              walletAddress,
              itemType,
              nftId,
              tokenId: (itemBeWithdrawn.nft as Nft).tokenId,
              manager,
            });
          }
        });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Create withdraw request failed. Please try again',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return withdraw;
  }

  async retrieveWithdrawAndDepositHistoriesByUserId(
    userId: number,
    pageOptionsDto: PageOptionsDto,
    filter: WithdrawHistoriesFilterDto
  ) {
    try {
      const queryBuilder = this.withdrawRepository
        .createQueryBuilder('withdraw')
        .where('withdraw.userId = :userId', { userId: userId });

      if (filter.withdrawType) {
        queryBuilder.andWhere('withdraw.type = :type', {
          type: filter.withdrawType,
        });
      }

      if (filter.withdrawStatus) {
        queryBuilder.andWhere('withdraw.status = :status', {
          status: filter.withdrawStatus,
        });
      }

      if (filter.collectionAddress) {
        queryBuilder.andWhere(
          'withdraw.collectionAddress = :collectionAddress',
          {
            collectionAddress: filter.collectionAddress,
          }
        );
      }

      if (filter.tokenAddress) {
        queryBuilder.andWhere('withdraw.tokenAddress = :tokenAddress', {
          tokenAddress: filter.tokenAddress,
        });
      }

      queryBuilder
        .orderBy('withdraw.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      this.logger.error(
        error,
        `retrieveWithdrawHistoriesByUserId - ${userId}`,
        'WithdrawService'
      );
      exceptionHandler(error);
    }
  }

  async retrieveWithdrawAndDepositHistoriesDetailById(id: number) {
    try {
      const withdraw = await this.withdrawRepository.findOne({
        where: { id },
      });

      if (!withdraw) {
        throw new NotFoundException('Withdraw detail not found by id');
      }

      return withdraw;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveWithdrawHistoriesDetailById - ${id}`,
        'WithdrawService'
      );
      exceptionHandler(error);
    }
  }

  private async payWithdrawalFee(
    userId: number,
    withdrawType: WithdrawType,
    manager
  ) {
    const spendingBalance = await this.spendingBalanceRepository.findOneBy({
      owner: userId,
      tokenAddress: TokenInfos.BLB.address,
    });

    if (!spendingBalance) {
      throw new NotFoundException('Spending balance not found');
    }

    if (withdrawType === WithdrawType.TOKEN) {
      if (spendingBalance.balance < +process.env.TOKEN_WITHDRAW_BLB_FEE) {
        throw new HttpException(
          'Insufficient balance to pay withdrawal fee',
          HttpStatus.BAD_REQUEST
        );
      }

      spendingBalance.balance = new BigNumber(spendingBalance.balance)
        .minus(+process.env.TOKEN_WITHDRAW_BLB_FEE)
        .toNumber();
      spendingBalance.availableBalance = new BigNumber(
        spendingBalance.availableBalance
      )
        .minus(+process.env.TOKEN_WITHDRAW_BLB_FEE)
        .toNumber();
    } else if (withdrawType === WithdrawType.NFT) {
      if (spendingBalance.balance < +process.env.NFT_WITHDRAW_BLB_FEE) {
        throw new HttpException(
          'Insufficient balance to pay withdrawal fee',
          HttpStatus.BAD_REQUEST
        );
      }

      spendingBalance.balance = new BigNumber(spendingBalance.balance)
        .minus(+process.env.NFT_WITHDRAW_BLB_FEE)
        .toNumber();
      spendingBalance.availableBalance = new BigNumber(
        spendingBalance.availableBalance
      )
        .minus(+process.env.NFT_WITHDRAW_BLB_FEE)
        .toNumber();
    }

    await manager.save(spendingBalance);
  }

  // Deprecated: 현 시점에서는 필요없음. 추후 admin wallet 가스비 체크 용도로 활용 가능
  // async verifyNativeBalance({
  //   userId,
  //   walletAddress,
  //   tokenAddress,
  //   amount,
  //   collectionAddress,
  //   tokenId,
  // }: IVerifyNativeBalanceInput): Promise<IVerifyNativeBalanceOutput> {
  //   const nativeSpendingBalance =
  //     await this.spendingBalanceRepository.findOneBy({
  //       owner: userId,
  //       tokenAddress: ADMIN_TOKEN.address,
  //     });

  //   if (!nativeSpendingBalance) {
  //     throw new HttpException(
  //       'Invalid native token funds to withdraw. Please try again',
  //       HttpStatus.NOT_FOUND
  //     );
  //   }

  //   const gasLimit = tokenAddress
  //     ? await estimateGasTransferToken(
  //         process.env.ADMIN_WALLET_ADDRESS,
  //         walletAddress,
  //         tokenAddress,
  //         amount
  //       )
  //     : await estimateGasTransferNft(
  //         process.env.ADMIN_WALLET_ADDRESS,
  //         walletAddress,
  //         collectionAddress,
  //         tokenId
  //       );

  //   const getLimitToBigNumber = new BigNumber(gasLimit);

  //   if (
  //     getLimitToBigNumber.isGreaterThan(nativeSpendingBalance.availableBalance)
  //   ) {
  //     throw new HttpException(
  //       'Insufficient native token funds to withdraw. Please try again',
  //       HttpStatus.BAD_REQUEST
  //     );
  //   }

  //   if (tokenAddress === ADMIN_TOKEN.address) {
  //     const nativeTokenTransferred = getLimitToBigNumber.plus(amount);
  //     if (
  //       nativeTokenTransferred.isGreaterThan(
  //         nativeSpendingBalance.availableBalance
  //       )
  //     ) {
  //       throw new HttpException(
  //         'Insufficient native token funds to withdraw. Please try again',
  //         HttpStatus.BAD_REQUEST
  //       );
  //     }
  //   }

  //   return { gasLimit: getLimitToBigNumber, nativeSpendingBalance };
  // }

  // Deprecated: 현 시점에서는 필요없음. 추후 admin wallet 가스비 체크 용도로 활용 가능
  // async updateNativeBalance({
  //   gasLimit,
  //   nativeSpendingBalance,
  // }: IVerifyNativeBalanceOutput): Promise<void> {
  //   nativeSpendingBalance.availableBalance = new BigNumber(
  //     nativeSpendingBalance.availableBalance
  //   )
  //     .minus(gasLimit)
  //     .toString();
  //   nativeSpendingBalance.balance = new BigNumber(nativeSpendingBalance.balance)
  //     .minus(gasLimit)
  //     .toString();
  //   await nativeSpendingBalance.save();
  // }
}
