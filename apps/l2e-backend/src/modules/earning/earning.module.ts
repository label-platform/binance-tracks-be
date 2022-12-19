import { Module } from '@nestjs/common';
import { Headphone, User, ListenHistory } from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningService } from './earning.service';
import { EarningController } from './earning.controller';

const ImportedModels = TypeOrmModule.forFeature([Headphone, ListenHistory, User]);

@Module({
  imports: [ImportedModels],
  controllers: [EarningController],
  providers: [EarningService],
})
export class EarningsModule { }
