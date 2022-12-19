import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../../users/users.module';
import { LocalStrategy } from './strategies/local.strategy';
import { WalletJwtStrategy } from './strategies/wallet-jwt.strategy';

const AuthJwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: '1d',
      noTimestamp: true,
    },
  }),
  inject: [ConfigService],
});

@Module({
  imports: [AuthJwtModule, forwardRef(() => UsersModule), PassportModule],
  providers: [AuthService, LocalStrategy, WalletJwtStrategy],
  exports: [AuthService, AuthJwtModule],
})
export class AuthModule {}
