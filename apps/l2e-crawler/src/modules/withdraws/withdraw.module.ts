import { Logger, Module } from '@nestjs/common';
import { WithdrawService } from '@withdraws/withdraw.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Item,
  Nft,
  SpendingBalance,
  User,
  Withdraw,
} from '@libs/l2e-queries/entities';

const ImportedModels = TypeOrmModule.forFeature([
  SpendingBalance,
  User,
  Nft,
  Withdraw,
  Item,
]);
@Module({
  imports: [ImportedModels],
  providers: [WithdrawService, Logger],
  exports: [WithdrawService],
})
export class WithdrawModule {}
