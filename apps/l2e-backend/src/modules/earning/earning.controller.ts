import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EarningService } from './earning.service';
import { EarningDto } from '@libs/l2e-queries/dtos';
import { ApiKeyAuthGuard } from '@src/cores/guards/api-key-auth.guard';

@ApiTags('earning')
@Controller('earning')
export class EarningController {
  constructor(private readonly earningService: EarningService) {}

  @Post('token')
  @UseGuards(ApiKeyAuthGuard)
  getEarnForUser(@Body() earningDatas: EarningDto) {
    return this.earningService.processCalculation(earningDatas.data);
  }

}
