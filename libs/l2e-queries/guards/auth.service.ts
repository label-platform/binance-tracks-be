import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { JwtUser } from 'src/users/interfaces/jwt-user.interface';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  verify(jwtString: string) {
    try {
      const payload = this.jwtService.verify(
        jwtString,
        process.env.JWT_SECRET as JwtVerifyOptions,
      ) as unknown as string & JwtUser;
      const { account_address, sub,  } = payload;
      return {
        account_address,
      };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.getCurrentUser({ email });
    const isValid =
      user;

    if (isValid) {
      return user;
    }

    return null;
  }

  async generateEmailJWT(user: any) {
    const payload = {
      sub: user._id.toString(),
      role: user.type,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  async generateWalletJWT(user: any) {
    const payload = {
      sub: user._id.toString(),
      role: user.type,
      account_address: user.walletAddress,
    };

    return this.jwtService.sign(payload);
  }
}
