import { Inject, Injectable } from '@nestjs/common';
import { OtpModuleOptions } from './otp.interfaces';
import { authenticator } from 'otplib';

@Injectable()
export class OtpService {
  constructor(
    @Inject('OTP_OPTIONS') private readonly options: OtpModuleOptions
  ) {}

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  keyUri(walletAddress: string, secret: string) {
    return authenticator.keyuri(walletAddress, this.options.issuer, secret);
  }

  verify(token: string, secret: string) {
    return authenticator.verify({ token, secret });
  }
}
