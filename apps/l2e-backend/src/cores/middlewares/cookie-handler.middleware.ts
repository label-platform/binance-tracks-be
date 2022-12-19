import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from '@src/modules/auth';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessJWT } from '../utils/jwt';

/**
 * @deprecated
 */
@Injectable()
export class CookieHandlerMiddleware implements NestMiddleware {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { accessToken, refreshToken } = req.cookies;

    // TODO: refactoring. 임시로 guard 없는 API는 JWT 없이도 호출 가능하도록 함.
    if (accessToken === undefined || refreshToken === undefined) {
      return next();
    }

    try {
      const result = verifyAccessJWT(accessToken);
      if (result) {
        return next();
      }
    } catch (error) {
      // TODO: expired token일 경우에만 refresh token을 이용해서 access token을 발급하고 쿠키에 저장함.
      // refresh token을 이용해서 access token을 발급하고 쿠키에 저장함.
      const newAccessToken =
        await this.authService.generateNewAccessJWTWithRefreshToken({
          refreshToken,
        });
      req.cookies.accessToken = newAccessToken.accessToken;
      // TODO: temp / for local cors
      res.cookie('accessToken', newAccessToken.accessToken, {
        httpOnly: false,
        sameSite: 'none',
        secure: true,
      });
      next();
    }
  }
}
