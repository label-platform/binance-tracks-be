import { OtpModuleOptions } from './otp.interfaces';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { OtpService } from './otp.service';

@Module({})
@Global()
export class OtpModule {
  static forRoot(options: OtpModuleOptions): DynamicModule {
    return {
      module: OtpModule,
      providers: [
        {
          provide: 'OTP_OPTIONS',
          useValue: options,
        },
        OtpService,
      ],
      exports: [OtpService],
    };
  }
}
