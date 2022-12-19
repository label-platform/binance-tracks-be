import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { verifyAccessJWT } from '@cores/utils/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      if (!request.headers.authorization) {
        throw new HttpException(
          'jwt must be provided',
          HttpStatus.UNAUTHORIZED
        );
      }

      const accessToken: string =
        request.headers.authorization.split('Bearer ')[1];
      if (!accessToken) {
        throw new HttpException(
          'jwt must be provided',
          HttpStatus.UNAUTHORIZED
        );
      }

      const payload = verifyAccessJWT(accessToken);

      if (payload) {
        request.user = payload;
        return true;
      }
      return false;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }
}
