import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { User } from '@libs/l2e-queries/entities';
import { EnergiesService } from './energies.service';
import { Roles } from '@src/cores/decorators/role.decorator';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { RolesGuard } from '@src/cores/guards/roles.guard';
import { ApiKeyAuthGuard } from '@src/cores/guards/api-key-auth.guard';

@Controller('energies')
export class EnergiesController {
  constructor(private readonly energiesService: EnergiesService) {}

  @Get('')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  retrieveEnergyInfoByJwt(@UserScope() user: User) {
    return this.energiesService.retrieveEnergyInfoByJwt(user.id);
  }

  /**
   * @see: test용 API, API로 활용은 안할거 같음
   */
  @Put('/energy-cap')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  updateEnergyCap(@UserScope() user: User) {
    return this.energiesService.updateEnergyCap(user.id);
  }

  @Put('/available-energy')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  updateAvailableEnergy(
    @UserScope() user: User,
    @Body('consumedEnergy') consumedEnergy: number
  ) {
    return this.energiesService.updateAvailableEnergy(user.id, consumedEnergy);
  }

  @Put('/available-energy-by-times')
  // @Roles('listener')
  // @UseGuards(RolesGuard)
  // @UseGuards(JwtAuthGuard)
  @UseGuards(ApiKeyAuthGuard)
  updateAvailableEnergyByTime( @Body('userId') userId: number, @Body('playTime') playTime: number ) {
    return this.energiesService.updateAvailableEnergyByTime(userId, playTime);
  }
}
