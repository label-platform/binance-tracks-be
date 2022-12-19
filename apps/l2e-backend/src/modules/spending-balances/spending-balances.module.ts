import { Logger, Module } from '@nestjs/common';
import { SpendingBalancesService } from './spending-balances.service';
import { SpendingBalancesController } from './spending-balances.controller';
import { SpendingBalance } from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

const ImportedModels = TypeOrmModule.forFeature([SpendingBalance]);

@Module({
  imports: [ImportedModels],
  controllers: [SpendingBalancesController],
  providers: [SpendingBalancesService, Logger],
  exports: [SpendingBalancesService],
})
export class SpendingBalancesModule {}
