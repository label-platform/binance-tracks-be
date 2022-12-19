import {
  BadRequestException,
  Body,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateActivationCodeDto,
  UpdateActivationCodeToUserDto,
} from '@libs/l2e-queries/dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivationCode, User } from '@libs/l2e-queries/entities';
import {
  ActivationCodeRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import { exceptionHandler } from '@src/common/exception-handler';

@Injectable()
export class ActivationCodeService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(ActivationCode)
    private readonly activationCodeRepository: ActivationCodeRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository
  ) {}

  async create(
    @Body() createActivationCodeDto: CreateActivationCodeDto
  ): Promise<ActivationCode> {
    const user = await this.userRepository.findOneBy({
      id: createActivationCodeDto.owner,
    });
    if (!user) {
      throw new NotFoundException('Owner does not exist');
    }

    try {
      const createdActivationCode = this.activationCodeRepository.create(
        createActivationCodeDto
      );
      return await createdActivationCode.save();
    } catch (error) {
      this.logger.error(
        error,
        `create(${createActivationCodeDto})`,
        'ActivationCodeService'
      );
      exceptionHandler(error);
    }
  }

  async getAll(): Promise<ActivationCode[]> {
    try {
      return await this.activationCodeRepository.find({
        relations: ['owner'],
      });
    } catch (error) {
      this.logger.error(error, `getAll()`, 'ActivationCodeService');
      exceptionHandler(error);
    }
  }

  async getActivationCodeByCode(code: string): Promise<ActivationCode> {
    try {
      return await this.activationCodeRepository.findOneBy({
        code,
      });
    } catch (error) {
      this.logger.error(
        error,
        `getActivationCodeByCode(${code})`,
        'ActivationCodeService'
      );
      exceptionHandler(error);
    }
  }

  async updateActivationCodeToUser(
    updateActivationCodeToUserDto: UpdateActivationCodeToUserDto
  ): Promise<void> {
    try {
      const { email, activationCode } = updateActivationCodeToUserDto;
      if (!email || !activationCode) {
        throw new BadRequestException('email or activationCode is required');
      }
      const currentActivationCode = await this.getActivationCodeByCode(
        activationCode
      );
      if (!currentActivationCode || currentActivationCode.register) {
        throw new BadRequestException(
          'Activation code does not exist. Please try again'
        );
      }
      const user = await this.userRepository.findOneBy({ email });
      const registeredCode = await this.userRepository.findOneBy({
        activationCodeId: currentActivationCode.id,
      });
      if (registeredCode) {
        throw new ConflictException('Code is already registered');
      }
      await this.activationCodeRepository.manager.transaction(
        async (transactionalEntityManager) => {
          user.activationCodeId = currentActivationCode.id;
          await transactionalEntityManager.save(user);
          await transactionalEntityManager.update(
            ActivationCode,
            { id: currentActivationCode.id },
            { register: user.id }
          );
        }
      );
    } catch (error) {
      this.logger.error(
        error,
        `updateActivationCodeToUser(${updateActivationCodeToUserDto})`,
        'ActivationCodeService'
      );
      exceptionHandler(error);
    }
  }
  async fetchUserActivationCodeList(userId: number) {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
      }
      const list = await this.activationCodeRepository.find({
        relations: ['owner', 'register'],
        where: { owner: { id: userId } },
      });
      return list;
    } catch (error) {
      this.logger.error(
        error,
        `fetchUserActivationCodeList(${userId})`,
        'ActivationCodeService'
      );
      exceptionHandler(error);
    }
  }
}
