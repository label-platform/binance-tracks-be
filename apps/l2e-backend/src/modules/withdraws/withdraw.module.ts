import { Logger, Module } from '@nestjs/common';
import { WithdrawService } from '@withdraws/withdraw.service';
import { WithdrawController } from '@withdraws/withdraw.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Item,
  Nft,
  SpendingBalance,
  Withdraw,
} from '@libs/l2e-queries/entities';
import { PoliciesModule } from '../policies/policies.module';

const ImportedModels = TypeOrmModule.forFeature([
  SpendingBalance,
  Nft,
  Item,
  Withdraw,
]);

@Module({
  imports: [ImportedModels, PoliciesModule],
  providers: [WithdrawService, Logger],
  controllers: [WithdrawController],
})
export class WithdrawModule {}
