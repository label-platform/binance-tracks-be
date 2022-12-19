import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';
import { toFileStream } from 'qrcode';
import { Response } from 'express';

@Injectable()
export class QrCodeService {
  getPassThrough(): PassThrough {
    return new PassThrough();
  }

  async toFileStream(qrStream: PassThrough, otpAuthUrl): Promise<any> {
    return await toFileStream(qrStream, otpAuthUrl);
  }

  pipe(stream: Response, passThrough: PassThrough) {
    return passThrough.pipe(stream);
  }

  setHeader(stream: Response, name: string, value: string) {
    const str = stream;
    str.setHeader(name, value);
    return str;
  }
}
