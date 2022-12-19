import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NftModule } from '@nfts/index';
import { ActivationCodeModule } from '@activation-codes/index';
import { AuthModule } from '@auth/index';
import { UserModule } from '@users/index';
import { EmailModule } from '@emails/index';
import { DatabaseModule } from '@libs/l2e-database';
import { ConfigModule } from '@nestjs/config';
import { WithdrawModule } from '@withdraws/index';
import { InventoriesModule } from '@inventories/index';
import { PaginationModule } from '@libs/l2e-pagination';
import { MarketplaceModule } from '@marketplace/index';
import { PoliciesModule } from './policies/policies.module';
import { SongManagementModule } from './song-management';
import { PlaylistManagerModule } from './playlist/playlist-manager.module';
import { EnergiesModule } from './energies/energies.module';
import { SpendingBalancesModule } from './spending-balances/spending-balances.module';
import { PlaylistCategoryModule } from './playlist-categories/playlist-category.module';
import { EarningsModule } from './earning/earning.module';
import { HealthzModule } from './healthz/healthz.module';
@Module({
  imports: [
    MarketplaceModule,
    ActivationCodeModule,
    AuthModule,
    UserModule,
    DatabaseModule,
    NftModule,
    WithdrawModule,
    EmailModule.forRoot({
      apiKey: process.env.MAILDRILL_API_KEY,
      fromEmail: process.env.MAILDRILL_FROM_EMAIL,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
    }),
    InventoriesModule.forRoot({
      MYSTERYBOX_MAX_PARAMETER: Number(process.env.MYSTERYBOX_MAX_PARAMETER),
      MYSTERYBOX_MIN_PARAMETER: Number(process.env.MYSTERYBOX_MIN_PARAMETER),
      MYSTERYBOX_SYSTEM_VALUE: Number(process.env.MYSTERYBOX_SYSTEM_VALUE),
    }),
    PaginationModule,
    PoliciesModule,
    SongManagementModule,
    PlaylistManagerModule,
    EnergiesModule,
    SpendingBalancesModule,
    PlaylistCategoryModule,
    EarningsModule,
    HealthzModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

/**
 * @deprecated
 */
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer): any {
//     consumer
//       .apply(CookieHandlerMiddleware)
//       // cookie-handler middleware를 통과하지 않을 경로를 추가하면 미들웨어 통과하지 않음
//       .exclude(
//         { path: '/api/auth/send-otp', method: RequestMethod.POST },
//         {
//           path: '/api/auth/login-by-otp/confirm-otp',
//           method: RequestMethod.POST,
//         },
//         { path: '/api/auth/login-by-password', method: RequestMethod.POST },
//         { path: '/api/inventories/mystery-boxes', method: RequestMethod.POST }
//       )
//       .forRoutes('*');
//   }
// }
