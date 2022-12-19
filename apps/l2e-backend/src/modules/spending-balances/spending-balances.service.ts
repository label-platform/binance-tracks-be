import {
  CostDto,
  MainNetNetwork,
  TokenSymbol,
  UserSpendingBalanceDto,
} from '@libs/l2e-queries/dtos';
import { SpendingBalance } from '@libs/l2e-queries/entities';
import { SpendingBalanceRepository } from '@libs/l2e-queries/repositories';
import { TokenInfos } from '@libs/l2e-utils/constants';
import { convertNumberWithDecimalFloor } from '@libs/l2e-utils/util-functions';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class SpendingBalancesService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async createSpendingBalance(userId: number) {
    const defaultInfos = {
      owner: userId,
      network: MainNetNetwork.BSC,
      balance: 0,
      availableBalance: 0,
    };
    await this.dataSource.createEntityManager().transaction(async (manager) => {
      const spendingBalanceBNB = this.spendingBalanceRepository.create({
        ...defaultInfos,
        tokenSymbol: TokenSymbol.BNB,
        tokenDecimals: TokenInfos.BNB.decimals,
        tokenAddress: TokenInfos.BNB.address,
      });
      await manager.save(spendingBalanceBNB);

      const spendingBalanceLBL = this.spendingBalanceRepository.create({
        ...defaultInfos,
        tokenSymbol: TokenSymbol.LBL,
        tokenDecimals: TokenInfos.LBL.decimals,
        tokenAddress: TokenInfos.LBL.address,
      });
      await manager.save(spendingBalanceLBL);

      const spendingBalanceBLB = this.spendingBalanceRepository.create({
        ...defaultInfos,
        tokenSymbol: TokenSymbol.BLB,
        tokenDecimals: TokenInfos.BLB.decimals,
        tokenAddress: TokenInfos.BLB.address,
      });
      await manager.save(spendingBalanceBLB);
    });
  }

  async deductSpendingBalances(
    userSpendingBalances: UserSpendingBalanceDto[],
    requiredCostDto: CostDto,
    manager: EntityManager
  ) {
    // 필요 cost가 0 이하일 경우에는 pass
    if (requiredCostDto.requiredCost <= 0) {
      return;
    }

    const userSpendingBalance = this.findUserSpendingBalance(
      userSpendingBalances,
      requiredCostDto
    );

    const balanceNumber =
      Number(userSpendingBalance.balance) - requiredCostDto.requiredCost;

    const availableBalanceNumber =
      Number(userSpendingBalance.availableBalance) -
      requiredCostDto.requiredCost;

    if (balanceNumber < 0 || availableBalanceNumber < 0) {
      throw new NotFoundException('Insufficient balance');
    }

    // BNB는 소수점 3자리, 그 외에는 소수점 2자리까지 표시
    let balance: number;
    let availableBalance: number;
    if (requiredCostDto.tokenSymbol === 'BNB') {
      balance = convertNumberWithDecimalFloor(balanceNumber, 3);
      availableBalance = convertNumberWithDecimalFloor(
        availableBalanceNumber,
        3
      );
    } else {
      balance = convertNumberWithDecimalFloor(balanceNumber, 2);
      availableBalance = convertNumberWithDecimalFloor(
        availableBalanceNumber,
        2
      );
    }

    const updateSpendingBalance = this.spendingBalanceRepository.create({
      balance,
      availableBalance,
    });

    this.updateUserSpendingBalance(
      userSpendingBalances,
      requiredCostDto.tokenSymbol,
      balance,
      availableBalance
    );
    return manager.update(
      SpendingBalance,
      userSpendingBalance.id,
      updateSpendingBalance
    );
  }

  async addSpendingBalances(
    userSpendingBalances: UserSpendingBalanceDto[],
    addCostDto: CostDto,
    manager: EntityManager
  ) {
    // 추가되는 token value가 0 이하일 경우에는 pass
    if (addCostDto.requiredCost <= 0) {
      return;
    }

    const userSpendingBalance = this.findUserSpendingBalance(
      userSpendingBalances,
      addCostDto
    );

    const balanceNumber =
      Number(userSpendingBalance.balance) + addCostDto.requiredCost;

    const availableBalanceNumber =
      Number(userSpendingBalance.availableBalance) + addCostDto.requiredCost;

    if (balanceNumber < 0 || availableBalanceNumber < 0) {
      throw new InternalServerErrorException('add spending balance error');
    }

    // BNB는 소수점 3자리, 그 외에는 소수점 2자리까지 표시
    let balance: number;
    let availableBalance: number;
    if (addCostDto.tokenSymbol === 'BNB') {
      balance = convertNumberWithDecimalFloor(balanceNumber, 3);
      availableBalance = convertNumberWithDecimalFloor(
        availableBalanceNumber,
        3
      );
    } else {
      balance = convertNumberWithDecimalFloor(balanceNumber, 2);
      availableBalance = convertNumberWithDecimalFloor(
        availableBalanceNumber,
        2
      );
    }

    const updateSpendingBalance = this.spendingBalanceRepository.create({
      balance,
      availableBalance,
    });

    this.updateUserSpendingBalance(
      userSpendingBalances,
      addCostDto.tokenSymbol,
      balance,
      availableBalance
    );

    return manager.update(
      SpendingBalance,
      userSpendingBalance.id,
      updateSpendingBalance
    );
  }

  async retrieveSpendingBalanceByUserId(userId: number) {
    try {
      const result = await this.spendingBalanceRepository
        .createQueryBuilder('spendingBalance')
        .leftJoin('spendingBalance.owner', 'users')
        .select('spendingBalance.tokenSymbol')
        .addSelect('spendingBalance.balance')
        .addSelect('spendingBalance.availableBalance')
        .where('users.id = :userId', { userId: userId })
        .getMany();

      if (!result) {
        throw new NotFoundException('Spending balance not found');
      }

      return result;
    } catch (error) {
      this.logger.error(
        error,
        `retrieveSpendingBalanceByUserId(${userId})`,
        'InventoriesService'
      );
      exceptionHandler(error);
    }
  }

  private findUserSpendingBalance(
    userSpendingBalances: UserSpendingBalanceDto[],
    costDto: CostDto
  ) {
    // find spendingBalance in spendingBalance array
    const userSpendingBalance = userSpendingBalances.find(
      (spendingBalance) => spendingBalance.tokenSymbol === costDto.tokenSymbol
    );
    if (!userSpendingBalance) {
      throw new NotFoundException('Spending balance not found');
    }

    // spending balance가 없을 경우 exception
    if (
      userSpendingBalance.balance === undefined ||
      userSpendingBalance.availableBalance === undefined
    ) {
      throw new InternalServerErrorException('Balance number is undefined');
    }

    return userSpendingBalance;
  }

  /**
   * @description: 함수로 전달된 userSpendingBalances에 있는 spendingBalance를 업데이트.
   한 트랜잭션 내에 여러변 spendingBalance를 업데이트 할 경우, userSpendingBalances에 있는 spendingBalance를 업데이트 해야함
   */

  private updateUserSpendingBalance(
    userSpendingBalances: UserSpendingBalanceDto[],
    tokenSymbol: TokenSymbol,
    balance: number,
    availableBalance: number
  ) {
    userSpendingBalances
      .filter((spendingBalance) => spendingBalance.tokenSymbol === tokenSymbol)
      .flatMap((spendingBalance) => {
        spendingBalance.balance = balance;
        spendingBalance.availableBalance = availableBalance;
      });
  }
}
