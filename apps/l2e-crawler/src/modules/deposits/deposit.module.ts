import { Module } from '@nestjs/common';
import { DepositService } from '@deposits/deposit.service';
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
  Item,
  Withdraw,
]);
@Module({
  imports: [ImportedModels],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
