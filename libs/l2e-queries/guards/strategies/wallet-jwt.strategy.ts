import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class WalletJwtStrategy extends PassportStrategy(
  Strategy,
  'wallet-jwt',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.getUserCredentials({
      id: payload.sub,
      walletAddress: payload.account_address,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      nonce: user.nonce,
      walletAddress: user.walletAddress,
    };
  }
}
