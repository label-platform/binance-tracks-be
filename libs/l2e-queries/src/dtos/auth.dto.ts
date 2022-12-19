import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ActiveActivationCodeDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;

  @IsNumberString()
  @IsOptional()
  @Length(8)
  @ApiProperty({
    example: '12345678',
  })
  activationCode: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: 'labell2e@',
  })
  password: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(6)
  @IsOptional()
  @ApiProperty({
    example: '123456',
  })
  otp: string;
}
export class UpdateActivationCodeToUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;

  @IsNumberString()
  @IsOptional()
  @IsNotEmpty()
  @Length(8)
  @ApiProperty({
    example: '12345678',
  })
  activationCode: string;
}

export class ConfirmOtpDto {
  @IsEmail()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(6)
  @ApiProperty({
    example: '123456',
  })
  otp: string;
}

export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;
}

export class LoginByPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'labell2e@',
  })
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmNlZGM1ZjFiZTIyY2RiNTkwMjJkNWUiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImNyZWF0ZWRBdCI6IjIwMjItMDctMTNUMTQ6NTM6MTkuNDg5WiIsInVwZGF0ZWRBdCI6IjIwMjItMDctMTNUMTc6MDM6MTYuMjIyWiIsIl9fdiI6MCwidXNlcm5hbWUiOiJBZHJpZW5OZ3V5ZW4iLCJpZCI6IjYyY2VkYzVmMWJlMjJjZGI1OTAyMmQ1ZSIsImlhdCI6MTY1NzczNTkyOSwiZXhwIjoxNjU3NzM2ODI5fQ.eA4Kf4xw_vMAyZluCtW9mtcg73ylMJmsjacPsEi5CMA',
  })
  refreshToken: string;
}

export class ResendOtpDto {
  @IsEmail()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;
}

export class UpdatePasswordDto {
  @IsEmail()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  //최소 8 자, 하나 이상의 대문자, 하나의 소문자, 하나의 숫자 및 하나의 특수 문자
  @Matches(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$#()^!%*?&])[A-Za-z\d$@$#()^!%*?&]{8,}/,
    {
      message: 'password too weak',
    }
  )
  @ApiProperty({
    example: 'labell2e@',
  })
  password: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(6)
  @ApiProperty({
    example: '123456',
  })
  otp: string;
}

export class twoFactorAuthenticationConfirmDto {
  @IsNotEmpty()
  @IsNumberString()
  @Length(6)
  @ApiProperty({
    example: '123456',
  })
  code: string;
}
