import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@src/cores/decorators/role.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ActivationCodeService } from '@activation-codes/activation-code.service';
import {
  CreateActivationCodeDto,
  UpdateActivationCodeToUserDto,
} from '@libs/l2e-queries/dtos';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { RolesGuard } from '@src/cores/guards/roles.guard';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { User } from '@libs/l2e-queries/entities';

@Controller('activation-codes')
@ApiTags('activation-codes')
export class ActivationCodeController {
  constructor(private readonly activationCodeService: ActivationCodeService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async create(@Body() CreateActivationCodeDto: CreateActivationCodeDto) {
    const createActivationCode = await this.activationCodeService.create(
      CreateActivationCodeDto
    );
    return {
      success: true,
      content: createActivationCode,
    };
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.activationCodeService.getAll();
  }

  @Put('update-activation-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async addActivationCode(
    @Body() updateActivationCodeToUserDto: UpdateActivationCodeToUserDto
  ) {
    await this.activationCodeService.updateActivationCodeToUser(
      updateActivationCodeToUserDto
    );
    return {
      success: true,
    };
  }

  @Get('user-activation-code-list')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async fetchUserActivationCodeList(@UserScope() user: User) {
    const data = await this.activationCodeService.fetchUserActivationCodeList(
      user.id
    );
    return {
      success: true,
      content: data,
    };
  }
}
