import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UpdateUserDto,
  UpdateUserWalletAddressDto,
  CreateUserDto,
  UserResponseDto,
  TokenEarningAmountDto,
} from '@libs/l2e-queries/dtos';
import { SpendingBalance, User } from '@libs/l2e-queries/entities';
import {
  SpendingBalanceRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import { exceptionHandler } from '@src/common/exception-handler';
import { convertNumberWithDecimalCeil } from '@libs/l2e-utils/util-functions';
import { ILike } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @InjectRepository(SpendingBalance)
    private readonly spendingBalanceRepository: SpendingBalanceRepository
  ) {}

  async getUserById(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['activationCodes'],
    });
    if (!user) {
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    }

    const userSpendingBalances = await this.retrieveSpendingBalances(userId);

    const result = {
      ...user,
      spendingBalances: userSpendingBalances,
    };
    return result;
  }

  async retrieveTokenEarningLimitInfo(userId: number) {
    const tokenEarningLimitInfo = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.dailyTokenEarningLimit', 'user.remainedTokenEarningLimit'])
      .where('user.id = :userId', { userId: userId })
      .getOne();

    return tokenEarningLimitInfo;
  }

  /**
   * @deprecated
   */
  async getActiveUser(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user || !user.activationCodeId) {
      return null;
    }

    const userSpendingBalances = await this.retrieveSpendingBalances(user.id);

    const result = {
      ...user,
      spendingBalances: userSpendingBalances,
    };

    return result;
  }

  /**
   * @deprecated
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  async update(
    userId: number,
    updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    const user: User = await this.userRepository.findOneBy({
      id: userId,
    });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const sameUsername = await this.userRepository.findOne({
      where: {
        username: updateUserDto.username,
      },
      select: ['username'],
    });
    if (sameUsername && sameUsername.username === updateUserDto.username) {
      throw new BadRequestException('Username already exists');
    }

    let updatedUser;
    try {
      updatedUser = await this.userRepository.save({
        ...user,
        username: updateUserDto.username,
      });
    } catch (error) {
      exceptionHandler(error);
    }

    const userSpendingBalances = await this.retrieveSpendingBalances(userId);

    const result = {
      ...updatedUser,
      spendingBalances: userSpendingBalances,
    };
    return result;
  }

  async updateWalletAddress(
    userId: number,
    updateUserWalletAddressDto: UpdateUserWalletAddressDto
  ): Promise<User> {
    const { walletAddress } = updateUserWalletAddressDto;
    const user = await this.userRepository.findOneBy({
      id: userId,
    });
    if (!user) {
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    }
    const existed = await this.userRepository.findOneBy({ walletAddress });
    try {
      if (user.walletAddress && user.walletAddress !== walletAddress) {
        throw new BadRequestException(
          'User already connected with another wallet address'
        );
      }
      if (existed && existed.id !== userId) {
        throw new BadRequestException(
          'The wallet is already connected with another user'
        );
      }
      const result = await this.userRepository.save({ ...user, walletAddress });
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }

  // TODO: ????????? ?????? ?????? ?????? ???. ????????? ????????? ???
  async reduceRemainedTokenEarningLimit(
    userId: number,
    tokenEarningAmountDto: TokenEarningAmountDto
  ) {
    const { tokenEarningAmount } = tokenEarningAmountDto;

    // ????????? ??????
    const convertedTokenEarningAmount = Math.abs(tokenEarningAmount);

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      select: ['remainedTokenEarningLimit', 'dailyTokenEarningLimit'],
    });
    if (!user) {
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    }

    // ????????? 2??????
    let remainedTokenEarningLimit = convertNumberWithDecimalCeil(
      user.remainedTokenEarningLimit - convertedTokenEarningAmount,
      2
    );
    if (remainedTokenEarningLimit < 0) {
      remainedTokenEarningLimit = 0;
    }

    await this.userRepository.update(
      { id: userId },
      {
        // TODO: ?????? ??????. DB?????? ?????? ?????? ????????? ???????????? ???????????? ?????? ?????? ??? ??? ??????
        // remainedTokenEarningLimit: () =>
        //   `remained_token_earning_limit - ${convertedTokenEarningAmount}`,
        remainedTokenEarningLimit,
      }
    );

    // TODO: ?????? ??????. ?????? ?????? ????????? ????????? ???????????? ??????. update??? ?????? ?????? ???????????? ???????????? ?????? ?????? ??? ??? ??????
    const result = {
      remainedTokenEarningLimit,
      dailyTokenEarningLimit: user.dailyTokenEarningLimit,
    };

    return result;
  }

  /**
   * @deprecated
   * @param createUserDto
   * @returns
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const createdUser: User = await this.userRepository.create(createUserDto);
      await createdUser.save();
      return createdUser;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async retrieveSpendingBalances(userId: number) {
    let userSpendingBalances: SpendingBalance[];
    try {
      userSpendingBalances = await this.spendingBalanceRepository
        .createQueryBuilder('spendingBalance')
        .leftJoin('spendingBalance.owner', 'users')
        .select('spendingBalance.tokenSymbol')
        .addSelect('spendingBalance.balance')
        .addSelect('spendingBalance.availableBalance')
        .where('users.id = :userId', { userId: userId })
        .getMany();
    } catch (error) {
      this.logger.error(
        'Error while retrieving spending balances',
        error,
        'UserService'
      );
    }

    return userSpendingBalances;
  }
}
