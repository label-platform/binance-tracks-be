import { User } from '@libs/l2e-queries/entities';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '@src/cores/decorators/role.decorator';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { RolesGuard } from '@src/cores/guards/roles.guard';
import { SpendingBalancesService } from './spending-balances.service';

@Controller('spending-balances')
export class SpendingBalancesController {
  constructor(
    private readonly spendingBalancesService: SpendingBalancesService
  ) {}

  @Get('')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveSpendingBalanceByUserId(@UserScope() user: User) {
    const content =
      await this.spendingBalancesService.retrieveSpendingBalanceByUserId(
        user.id
      );
    return {
      success: true,
      content,
    };
  }
}
