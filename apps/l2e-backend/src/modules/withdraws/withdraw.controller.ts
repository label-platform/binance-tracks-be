import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@libs/l2e-queries/entities';
import {
  CreateWithdrawTokenDto,
  CreateWithdrawNftDto,
  WithdrawHistoriesFilterDto,
} from '@libs/l2e-queries/dtos';
import { WithdrawService } from '@withdraws/withdraw.service';
import { JwtAuthGuard } from '@cores/guards/jwt-auth.guard';
import { UserScope } from '@cores/decorators/user.decorator';
import { PageOptionsDto } from '@libs/l2e-pagination/dtos';
import { Roles } from '@src/cores/decorators/role.decorator';
import { RolesGuard } from '@src/cores/guards/roles.guard';

@Controller('')
@ApiTags('withdraws')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('withdraws/token')
  @HttpCode(HttpStatus.CREATED)
  async withdrawTokenToMainWallet(
    @Body() createWithdrawTokenDto: CreateWithdrawTokenDto,
    @UserScope() user: User
  ) {
    const withDrawTokenResponse =
      await this.withdrawService.withdrawTokenToMainWallet(
        createWithdrawTokenDto,
        user
      );

    return {
      success: true,
      content: withDrawTokenResponse,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('withdraws/nft')
  @HttpCode(HttpStatus.CREATED)
  async withdrawNftToMainWallet(
    @Body() createWithdrawNftDto: CreateWithdrawNftDto,
    @UserScope() user: User
  ) {
    const withDrawNftResponse =
      await this.withdrawService.withdrawNftToMainWallet(
        createWithdrawNftDto,
        user
      );
    return {
      success: true,
      content: withDrawNftResponse,
    };
  }

  @Get('/histories/withdraws-deposits')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveWithdrawAndDepositHistoriesByUserId(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query() filter: WithdrawHistoriesFilterDto
  ) {
    const content =
      await this.withdrawService.retrieveWithdrawAndDepositHistoriesByUserId(
        user.id,
        pageOptionsDto,
        filter
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/histories/withdraws-deposits/detail')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveWithdrawAndDepositHistoriesDetailById(@Query('id') id: number) {
    const content =
      await this.withdrawService.retrieveWithdrawAndDepositHistoriesDetailById(
        +id
      );
    return {
      success: true,
      content,
    };
  }
}
