import { Injectable } from '@nestjs/common';
import { ConfirmOtpDto } from '@libs/l2e-queries/dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { UserOtpRepository } from '@libs/l2e-queries/repositories';
import { UserOtp } from '@libs/l2e-queries/entities';
import { LocalDateTime } from '@js-joda/core';

@Injectable()
export class UserOtpService {
  constructor(
    @InjectRepository(UserOtp)
    private readonly userOtpRepository: UserOtpRepository
  ) {}

  generateDigitOtp(): string {
    const optLength = Number(process.env.OTP_LENGTH) || 6;
    const digits = '0123456789';
    let otp = '';

    while (otp.length < optLength) {
      const index = Math.floor(Math.random() * digits.length);
      otp += digits[index];
    }
    return otp;
  }

  getOtpTimeOut(): LocalDateTime {
    const optTimeout = Number(process.env.OTP_TIMEOUT_IN_MIN) || 1;
    return LocalDateTime.now().plusMinutes(optTimeout);
  }

  async findOneAndUpdateOtp(
    email: string,
    otp: string,
    expiredAt: LocalDateTime
  ): Promise<UserOtp> {
    const _otp = await this.userOtpRepository.findOneBy({
      email,
    });
    if (_otp) {
      return await this.userOtpRepository.save({
        ..._otp,
        otp,
        expiredAt,
      });
    }

    return await this.userOtpRepository
      .create({
        otp,
        email,
        expiredAt,
      })
      .save();
  }

  async findByEmailAndOtp(confirmOtpDto: ConfirmOtpDto): Promise<UserOtp> {
    return await this.userOtpRepository.findOneBy(confirmOtpDto);
  }
}
