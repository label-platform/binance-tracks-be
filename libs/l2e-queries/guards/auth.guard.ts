import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { JwtUser } from 'src/users/interfaces/jwt-user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.headers.authorization) {
      throw new UnauthorizedException();
    }
    const jwtString: string = request.headers.authorization.split('Bearer ')[1];
    if (!jwtString) {
      return false;
    }
    request.user = this.verify(jwtString);

    return true;
  }

  private verify(jwtString: string) {
    try {
      const payload = this.jwtService.verify(
        jwtString,
        process.env.JWT_SECRET as JwtVerifyOptions,
      ) as unknown as string & JwtUser;
      const { account_address, sub } = payload;
      return {
        account_address,
      };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
