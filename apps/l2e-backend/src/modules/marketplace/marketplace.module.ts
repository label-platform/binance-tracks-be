import { SpendingBalancesService } from '@src/modules/spending-balances/spending-balances.service';
import {
  Headphone,
  HeadphoneBox,
  Item,
  ItemSale,
  Merchandise,
  Pinballhead,
  SaleHistory,
  SpendingBalance,
  Sticker,
  Ticket,
  User,
} from '@libs/l2e-queries/entities';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceUtilService } from './marketplace-util.service';
import { PoliciesModule } from '../policies/policies.module';
import { InventoriesModule } from '../inventories';
import { EnergiesModule } from '../energies/energies.module';

const importedModel = TypeOrmModule.forFeature([
  Item,
  ItemSale,
  SaleHistory,
  User,
  SpendingBalance,
  Headphone,
  HeadphoneBox,
  Pinballhead,
  Sticker,
  Ticket,
  Merchandise
]);

@Module({
  imports: [
    importedModel,
    PoliciesModule,
    InventoriesModule.forRoot({}),
    EnergiesModule,
  ],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    MarketplaceUtilService,
    SpendingBalancesService,
    Logger,
  ],
})
export class MarketplaceModule {}
