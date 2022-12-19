import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '@users/user.service';
import { JwtAuthGuard } from '@cores/guards/jwt-auth.guard';
import {
  UpdateUserDto,
  UpdateUserWalletAddressDto,
  CreateUserDto,
  TokenEarningAmountDto,
} from '@libs/l2e-queries/dtos';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { User } from '@libs/l2e-queries/entities';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: number) {
    const userInfo = await this.userService.getUserById(id);
    return {
      success: true,
      content: userInfo,
    };
  }

  @Get('detail')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserByJwt(@UserScope() user: User) {
    const userInfo = await this.userService.getUserById(user.id);
    return {
      success: true,
      content: userInfo,
    };
  }

  @Get('token-earning-limit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async retrieveTokenEarningLimitInfo(@UserScope() user: User) {
    const tokenEarningLimitInfo =
      await this.userService.retrieveTokenEarningLimitInfo(user.id);
    return {
      success: true,
      content: tokenEarningLimitInfo,
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @UserScope() user: User,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const updatedUser = await this.userService.update(user.id, updateUserDto);
    return {
      success: true,
      content: updatedUser,
    };
  }

  @Put('wallet-address')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateWalletAddress(
    @UserScope() user: User,
    @Body() updateUserWalletAddressDto: UpdateUserWalletAddressDto
  ) {
    const updatedUser = await this.userService.updateWalletAddress(
      user.id,
      updateUserWalletAddressDto
    );
    return {
      success: true,
      content: updatedUser,
    };
  }

  @Put('remained-token-earning-limit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reduceRemainedTokenEarningLimit(
    @UserScope() user: User,
    @Body() tokenEarningAmountDto: TokenEarningAmountDto
  ) {
    const reducedRemainedTokenEarningLimit =
      await this.userService.reduceRemainedTokenEarningLimit(
        user.id,
        tokenEarningAmountDto
      );
    return {
      success: true,
      content: reducedRemainedTokenEarningLimit,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const createdUser = await this.userService.create(createUserDto);

    return {
      success: true,
      content: createdUser,
    };
  }
}
