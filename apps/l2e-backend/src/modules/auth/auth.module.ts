import { Logger, Module } from '@nestjs/common';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { UserModule } from '@users/user.module';
import { UserOtpModule } from '@user-otps/user-otp.module';
import { ActivationCodeModule } from '@activation-codes/activation-code.module';
import { LoginSessionModule } from '@login-sessions/login-session.module';
import { OtpModule } from './utils/otp/otp.module';
import { QrCodeModule } from './utils/qrcode/qrcode.module';
import { SpendingBalancesModule } from '../spending-balances/spending-balances.module';
import { Item, Headphone, HeadphoneDock } from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

const ImportedModels = TypeOrmModule.forFeature([
  Item,
  Headphone,
  HeadphoneDock,
]);
@Module({
  imports: [
    UserModule,
    UserOtpModule,
    ActivationCodeModule,
    LoginSessionModule,
    OtpModule.forRoot({
      issuer: process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME,
    }),
    QrCodeModule.forRoot(),
    SpendingBalancesModule,
    ImportedModels
  ],
  controllers: [AuthController],
  providers: [AuthService, Logger],
  exports: [AuthService],
})
export class AuthModule {}
