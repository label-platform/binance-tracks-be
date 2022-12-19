import { EnergyResponseDto, ItemStatus, Quality } from '@libs/l2e-queries/dtos';
import { Headphone, Item, User } from '@libs/l2e-queries/entities';
import {
  HeadphoneRepository,
  ItemRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import { TIME_REWARD_TOKEN } from '@libs/l2e-utils/constants';
import {
  convertNumberWithDecimalCeil,
  convertNumberWithDecimalFloor,
} from '@libs/l2e-utils/util-functions';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { DataSource } from 'typeorm';

@Injectable()
export class EnergiesService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectRepository(Item) private readonly itemRepository: ItemRepository,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async retrieveEnergyInfoByJwt(userId: number): Promise<EnergyResponseDto> {
    try {
      const energyInfo = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', { userId })
        .select(['user.energyCap', 'user.availableEnergy'])
        .getOne();

      if (!energyInfo) {
        throw new NotFoundException('User does not exist');
      }

      return {
        energyCap: energyInfo.energyCap,
        availableEnergy: energyInfo.availableEnergy,
        userId,
      };
    } catch (error) {
      this.logger.error(
        error,
        `EnergiesService.retrieveEnergyInfoByJwt(${userId})`,
        'EnergiesService'
      );
      exceptionHandler(error);
    }
  }

  async updateEnergyCap(userId: number): Promise<EnergyResponseDto> {
    try {
      const energyInfo = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', { userId })
        .select(['user.energyCap', 'user.availableEnergy'])
        .getOne();

      if (!energyInfo) {
        throw new NotFoundException('User does not exist');
      }

      const totalHeadphonesForEnergy = await this.headphoneRepository
        .createQueryBuilder('headphone')
        .leftJoinAndSelect('headphone.item', 'items')
        .where('items.user = :userId', { userId })
        .andWhere('items.itemStatus IN (:itemStatuses)', {
          itemStatuses: [
            ItemStatus.IDLE,
            ItemStatus.LEVELING,
            ItemStatus.LISTENING,
          ],
        })
        .select(['headphone.quality'])
        .getMany();

      // 헤드폰 총 개수에 따라 에너지 계산
      const totalCountHeadphone = totalHeadphonesForEnergy.length;
      let baseEnergy = 0;
      if (totalCountHeadphone > 0 && totalCountHeadphone < 3) {
        baseEnergy = 20;
      } else if (totalCountHeadphone >= 3 && totalCountHeadphone < 9) {
        baseEnergy = 40;
      } else if (totalCountHeadphone >= 9 && totalCountHeadphone < 15) {
        baseEnergy = 90;
      } else if (totalCountHeadphone >= 15 && totalCountHeadphone < 30) {
        baseEnergy = 120;
      } else if (totalCountHeadphone >= 30) {
        baseEnergy = 200;
      }

      // 헤드폰 퀄리티 별로 보너스 에너지 계산
      let totalBonusEnergy = 0;
      new Set(
        totalHeadphonesForEnergy.map((headphone) => headphone.quality)
      ).forEach((quality) => {
        switch (quality) {
          case Quality.UNCOMMON:
            totalBonusEnergy += 10;
            break;
          case Quality.RARE:
            totalBonusEnergy += 20;
            break;
          case Quality.EPIC:
            totalBonusEnergy += 30;
            break;
          case Quality.LEGENDARY:
            totalBonusEnergy += 40;
            break;
          default:
            break;
        }
      });

      const newEnergyCap = baseEnergy + totalBonusEnergy;

      let newAvailableEnergy =
        energyInfo.availableEnergy + (newEnergyCap - energyInfo.energyCap);
      if (newAvailableEnergy > newEnergyCap) {
        newAvailableEnergy = newEnergyCap;
      }

      const updateEnergyCap = await this.userRepository
        .create({
          id: userId,
          energyCap: newEnergyCap,
          availableEnergy: convertNumberWithDecimalFloor(newAvailableEnergy, 1),
        })
        .save();

      return {
        energyCap: updateEnergyCap.energyCap,
        availableEnergy: energyInfo.availableEnergy,
        userId,
      };
    } catch (error) {
      this.logger.error(
        error,
        `EnergiesService.updateEnergyCap(${userId})`,
        'EnergiesService'
      );
      exceptionHandler(error);
    }
  }

  async updateAvailableEnergy(
    userId: number,
    consumedEnergy: number
  ): Promise<EnergyResponseDto> {
    let res: EnergyResponseDto;
    try {
      await this.dataSource
        .createEntityManager()
        .transaction(async (manager) => {
          const energyInfo = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id = :userId', { userId })
            .select([
              'user.energyCap',
              'user.availableEnergy',
              'user.countEnergy',
            ])
            .getOne();

          if (!energyInfo) {
            throw new NotFoundException('User does not exist');
          }

          const { energyCap, availableEnergy, countEnergy } = energyInfo;
          consumedEnergy = convertNumberWithDecimalCeil(consumedEnergy, 1);

          let newAvailableEnergy = availableEnergy - consumedEnergy;
          if (newAvailableEnergy < 0) {
            newAvailableEnergy = 0;
          }

          const addCountEnergy = countEnergy + consumedEnergy;

          const updateAvailableEnergy = this.userRepository.create({
            id: userId,
            availableEnergy: convertNumberWithDecimalFloor(
              newAvailableEnergy,
              1
            ),
            countEnergy: convertNumberWithDecimalFloor(addCountEnergy, 1),
          });

          //save by using transaction
          await manager.update(User, userId, updateAvailableEnergy);

          const energyResponseDto: EnergyResponseDto = {
            energyCap,
            availableEnergy: updateAvailableEnergy.availableEnergy,
            userId,
          };
          res = energyResponseDto;
        });
    } catch (error) {
      this.logger.error(
        error,
        `EnergiesService.updateAvailableEnergy(${userId})`,
        'EnergiesService'
      );
      exceptionHandler(error);
    }
    return res;
  }

  async updateAvailableEnergyByTime(userId: number, playTime: number) {
    try {
      // floor playtime to 10^1 * x
      playTime =
        convertNumberWithDecimalFloor(playTime / TIME_REWARD_TOKEN, 0) *
        TIME_REWARD_TOKEN;
      const consumedEnergy =
        playTime * parseFloat(process.env.ENERGY_CONSUMED_PER_SECOND);
      return await this.updateAvailableEnergy(userId, consumedEnergy);
    } catch (error) {
      this.logger.error(
        error,
        `EnergiesService.updateAvailableEnergy(${userId})`,
        'EnergiesService'
      );
      exceptionHandler(error);
    }
  }
}
