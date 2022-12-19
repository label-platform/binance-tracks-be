import { PoliciesModule } from './../policies/policies.module';
import { Logger, Module, Scope } from '@nestjs/common';
import { InventoriesController } from './inventories.controller';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import {
  Item,
  Headphone,
  HeadphoneDock,
  HeadphoneBox,
  MysteryBox,
  Sticker,
  Pinballhead,
  SpendingBalance,
  TracksFormula,
  User,
} from '@libs/l2e-queries/entities';
import { InventoriesModuleOptions } from './inventories.interface';
import { DynamicModule } from '@nestjs/common';
import { INVENTORIES_CONFIG_OPTIONS } from './inventories.constant';
import { InventoriesFormulaService } from './inventories-formula.service';
import {
  HeadphoneBoxesService,
  HeadphonesService,
  MysteryBoxesService,
  PinballheadsService,
  StickersService,
} from './services';
import {
  BalanceHelperForHeadphone,
  BalanceHelperForHeadphoneBox,
  BalanceHelperForMysteryBox,
  BalanceHelperForSticker,
} from '@src/common/balance-helper';
import { InventoriesUtilService } from './inventories-util.service';
import { Repository } from 'typeorm';
import { formulaSeed } from '@libs/l2e-queries/seed';
import { SpendingBalancesModule } from '../spending-balances/spending-balances.module';
import { EnergiesModule } from '../energies/energies.module';

const ImportedModels = TypeOrmModule.forFeature([
  Item,
  Headphone,
  HeadphoneDock,
  HeadphoneBox,
  MysteryBox,
  Sticker,
  Pinballhead,
  SpendingBalance,
  TracksFormula,
  User,
]);
@Module({
  imports: [
    ImportedModels,
    PoliciesModule,
    SpendingBalancesModule,
    EnergiesModule,
  ],
  controllers: [InventoriesController],
  providers: [
    HeadphonesService,
    HeadphoneBoxesService,
    StickersService,
    MysteryBoxesService,
    PinballheadsService,
    InventoriesFormulaService,
    InventoriesUtilService,
    // BalanceHelperForHeadphone,
    // BalanceHelperForHeadphoneBox,
    // BalanceHelperForSticker,
    // BalanceHelperForMysteryBox,
    Logger,
    {
      provide: 'FORMULA_DATA',
      inject: [getRepositoryToken(TracksFormula)],
      useFactory: async (formulaRepo: Repository<TracksFormula>) => {
        // await formulaRepo.delete({});
        // await formulaRepo
        //   .createQueryBuilder()
        //   .insert()
        //   .into(TracksFormula)
        //   .values(formulaSeed)
        //   .execute();
        const data = await formulaRepo.find();
        return data;
      },
    },
  ],
  exports: [InventoriesUtilService],
})
export class InventoriesModule {
  static forRoot(options: InventoriesModuleOptions): DynamicModule {
    return {
      module: InventoriesModule,
      providers: [
        {
          provide: INVENTORIES_CONFIG_OPTIONS,
          useValue: options,
        },
      ],
    };
  }
}
