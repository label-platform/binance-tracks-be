import { DynamicModule, Global, Module } from '@nestjs/common';
import { QrCodeService } from './qrcode.service';

@Module({})
@Global()
export class QrCodeModule {
  static forRoot(): DynamicModule {
    return {
      module: QrCodeModule,
      providers: [QrCodeService],
      exports: [QrCodeService],
    };
  }
}
