import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  LoginByPasswordDto,
  RefreshTokenDto,
  ConfirmOtpDto,
  SendOtpDto,
  UpdatePasswordDto,
  twoFactorAuthenticationConfirmDto as confirmTwoFactorAuthenticationDto,
} from '@libs/l2e-queries/dtos';
import { AuthService } from '@auth/auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { User } from '@libs/l2e-queries/entities';
import { UserScope } from '@src/cores/decorators/user.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    const sendOtpData = await this.authService.sendOtp(sendOtpDto);
    return {
      success: true,
      content: sendOtpData,
    };
  }

  @Post('2fa/confirm-email-otp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmEmailOtpForRegister(
    @UserScope() user: User,
    @Body() confirmOtpDto: ConfirmOtpDto
  ) {
    return await this.authService.confirmEmailOtpForRegister(
      confirmOtpDto,
      user.id
    );
  }

  @Post('login-by-otp/confirm-otp')
  @HttpCode(HttpStatus.OK)
  async confirmLoginByOtp(
    @Req() req: Request,
    @Body() confirmOtpDto: ConfirmOtpDto,
    @Res() res
  ) {
    const confirmData = await this.authService.confirmLoginByOtp(
      req,
      confirmOtpDto
    );

    res.send({
      success: true,
      content: confirmData,
    });
  }

  @Post('login-by-password')
  @HttpCode(HttpStatus.OK)
  async loginByPassword(
    @Req() req: Request,
    @Body() loginByPasswordDto: LoginByPasswordDto,
    @Res() res
  ) {
    const loginData = await this.authService.loginByPassword(
      req,
      loginByPasswordDto
    );

    res.send({
      success: true,
      content: loginData,
    });
  }

  @Post('2fa/otp-generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async registerTwoFactorAuthentication(
    @Res() response: Response,
    @UserScope() user: User
  ) {
    return this.authService.registerTwoFactorAuthentication(response, user);
  }

  @Post('2fa/otp-register-confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmForRegisterTwoFactorAuthentication(
    @UserScope() user: User,
    @Body() codeDto: confirmTwoFactorAuthenticationDto
  ) {
    return this.authService.confirmForRegisterTwoFactorAuthentication(
      codeDto.code,
      user.id
    );
  }

  @Post('2fa/otp-confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmTwoFactorAuthentication(
    @UserScope() user: User,
    @Body() codeDto: confirmTwoFactorAuthenticationDto
  ) {
    return this.authService.confirmTwoFactorAuthentication(
      codeDto.code,
      user.id
    );
  }

  @Put('2fa/otp-enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enableTwoFactorAuthentication(@UserScope() user: User) {
    await this.authService.updateEnableStatusTwoFactorAuthentication(
      user.id,
      true
    );

    return {
      success: true,
      content: 'Enable two factor authentication successfully',
    };
  }

  @Put('2fa/otp-disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disableTwoFactorAuthentication(@UserScope() user: User) {
    await this.authService.updateEnableStatusTwoFactorAuthentication(
      user.id,
      false
    );

    return {
      success: true,
      content: 'Disable two factor authentication successfully',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@UserScope() user: User, @Res() res) {
    await this.authService.logoutByUserId(user.id);

    res.send({
      success: true,
      content: 'Logout successfully',
    });
  }

  @Put('update-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async createPassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    await this.authService.updatePassword(updatePasswordDto);
    return {
      success: true,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.CREATED)
  async generateNewAccessJWT(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res() res
  ) {
    const newAccessToken =
      await this.authService.generateNewAccessJWTWithRefreshToken(
        refreshTokenDto
      );
    res.send({
      success: true,
      content: newAccessToken,
    });
  }
}
