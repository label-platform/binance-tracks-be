import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOtpService } from '@user-otps/user-otp.service';
import { UserOtp } from '@libs/l2e-queries/entities';

const UsersOtpModel = TypeOrmModule.forFeature([UserOtp]);

@Module({
  imports: [UsersOtpModel],
  providers: [UserOtpService],
  exports: [UserOtpService, UsersOtpModel],
})
export class UserOtpModule {}
