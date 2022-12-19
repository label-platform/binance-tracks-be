import { Body, Controller, Inject, Injectable, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EarningDto } from '@libs/l2e-queries/dtos';

@Controller('earning')
export class EarningController {
  constructor(
    @InjectQueue('earning') private readonly earningQueue: Queue
  ) { }

  // TODO: remove
  @Post('calculate')
  async transcode(@Body() earningDto: EarningDto) {
     await this.earningQueue.add('calculate', {
      data: earningDto.data
    });
  }
}
