import { LocalDateTime } from '@js-joda/core';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LoginByPasswordDto,
  RefreshTokenDto,
  ConfirmOtpDto,
  SendOtpDto,
  UpdatePasswordDto,
  Attribute,
  DockStatus,
  ItemStatus,
  ItemType,
  Quality,
} from '@libs/l2e-queries/dtos';

import { Headphone, HeadphoneDock, Item, User, UserOtp } from '@libs/l2e-queries/entities';
import {
  HeadphoneDockRepository,
  HeadphoneRepository,
  ItemRepository,
  UserOtpRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';

import {
  generateAccessJWT,
  generateRefreshJWT,
  verifyRefreshJWT,
} from '@cores/utils/jwt';
import { comparePassword, hashPassword } from '@src/cores/utils/bcrypt';
import {
  GenerateAccessJWTData,
  LoginResponseData,
  SendOtpData,
} from '@auth/auth.interface';
import { UserOtpService } from '@user-otps/user-otp.service';
import { EmailService } from '@emails/email.service';
import { LoginSessionService } from '@login-sessions/login-session.service';
import { Request, Response } from 'express';
import { getDeviceAndIpInformation } from '@src/cores/utils/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { QrCodeService } from './utils/qrcode/qrcode.service';
import { OtpService } from './utils/otp/otp.service';
import { DataSource, EntityManager } from 'typeorm';
import { SpendingBalancesService } from '../spending-balances/spending-balances.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(SpendingBalancesService)
    private readonly spendingBalanceService: SpendingBalancesService,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @InjectRepository(UserOtp)
    private readonly userOtpRepository: UserOtpRepository,
    @InjectRepository(Item) private readonly itemRepository: ItemRepository,
    @InjectRepository(Headphone)
    private readonly headphoneRepository: HeadphoneRepository,
    @InjectRepository(HeadphoneDock)
    private readonly headphoneDockRepository: HeadphoneDockRepository,
    private readonly userOtpService: UserOtpService,
    private readonly emailService: EmailService,
    private readonly loginSessionService: LoginSessionService,
    private readonly otpService: OtpService,
    private readonly qrCodeService: QrCodeService,
    private readonly dataSource: DataSource
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto): Promise<SendOtpData> {
    try {
      const { email } = sendOtpDto;

      const otp = this.userOtpService.generateDigitOtp();
      const expiredTime = this.userOtpService.getOtpTimeOut();

      await this.userOtpService.findOneAndUpdateOtp(email, otp, expiredTime);
      this.emailService.sendOtpVerificationEmail({ email, otp });
      return {
        otpSent: true,
      };
    } catch (error) {
      this.logger.error(error, `sendOtp(${sendOtpDto})`, 'AuthService');
      exceptionHandler(error);
    }
  }

  async returnLoginData(
    req: Request,
    email: string,
    isActivated: boolean
  ): Promise<LoginResponseData> {
    try {
      const user = await this.userRepository.findOneBy({ email });
      const { userData, accessToken, refreshToken } =
        this.generateResponseLoginData(user, isActivated);
      const { device, ip } = getDeviceAndIpInformation(req);
      await this.loginSessionService.findOneAndUpdateLoginSession({
        userId: user.id,
        accessToken,
        refreshToken,
        device,
        ip,
      });
      return {
        userData,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(error, `returnLoginData(${email})`, 'AuthService');
      exceptionHandler(error);
    }
  }

  async confirmLoginByOtp(
    req: Request,
    { email, otp }: ConfirmOtpDto
  ): Promise<LoginResponseData> {
    try {
      const userOtp = await this.userOtpService.findByEmailAndOtp({
        otp,
        email,
      });

      if (!userOtp || userOtp.expiredAt.isBefore(LocalDateTime.now())) {
        throw new BadRequestException('OTP is invalid. Please try again');
      }

      const user = await this.userRepository.findOneBy({ email });
      const newUser = !user;
      const inActiveUser = user && !user.activationCodeId;
      const activeUser = user && user.activationCodeId;

      if (newUser) {
        await this.dataSource.manager.transaction(
          async (manager: EntityManager) => {
            const newUserEntity = this.userRepository.create({
              email,
            });
            const newUser = await manager.save(newUserEntity);
            this.spendingBalanceService.createSpendingBalance(newUser.id);
            

            // await this.headphoneService.createHeadphone({
            //   userId: newUser.id,
            //   createdHeadphone: {
            //      headphoneId: null
            //   }
            // })

            {
              // create item
              //  imgURL 동적으로 입력 받거나 생성 필요
              const newItem = this.itemRepository.create({
                user: newUser.id,
                imgUrl: `https://prod-tracks.s3.amazonaws.com/NFT-images/headphones/default-headphone-small.png`,
                itemStatus: ItemStatus.LISTENING,
                type: ItemType.HEADPHONE,
              });
    
              const item = await manager.save(newItem);
    
              // create headphone
              //  stat 및 quality, cooldownTime 확률에 맞춰 생성
              const newHeadphone = this.headphoneRepository.create({
                item: item.id,
                baseLuck: 1,
                luck: 1,
                baseComfort: 1,
                comfort: 1,
                baseEfficiency: 1,
                efficiency: 1,
                baseResilience: 1,
                resilience: 1,
                quality: Quality.COMMON,
                cooldownTime: null,
              });
    
              await manager.save(newHeadphone);
    
              // create 4 headphone docks
              //  attribute 확률에 맞춰 생성
              for (let i = 1; i < 5; i++) {
                const newHeadphoneDock = this.headphoneDockRepository.create({
                  headphone: item.id,
                  position: i,
                  attribute: Attribute.EFFICIENCY,
                  dockStatus: DockStatus.NOT_OPENED,
                });
    
                await manager.save(newHeadphoneDock);
              }
            }

            await manager.update(UserOtp, { email }, { userId: newUser.id });
          }
        );
        return await this.returnLoginData(req, email, false);
      } else {
        if (inActiveUser) {
          return await this.returnLoginData(req, email, false);
        }
        if (activeUser) return await this.returnLoginData(req, email, true);
      }
    } catch (error) {
      this.logger.error(error, `confirmLoginByOtp(${email})`, 'AuthService');
      exceptionHandler(error);
    }
  }

  async confirmEmailOtpForRegister(
    { email, otp }: ConfirmOtpDto,
    userId: number
  ) {
    try {
      const userOtp = await this.userOtpService.findByEmailAndOtp({
        otp,
        email,
      });

      if (!userOtp || userOtp.expiredAt.isBefore(LocalDateTime.now())) {
        return { validCode: false, userId };
      }
    } catch (error) {
      this.logger.error(
        error,
        `confirmEmailOtpForRegister(${email})`,
        'AuthService'
      );
      exceptionHandler(error);
    }

    return { validCode: true, userId };
  }

  async loginByPassword(
    req: Request,
    loginByPasswordDto: LoginByPasswordDto
  ): Promise<LoginResponseData> {
    try {
      const { email } = loginByPasswordDto;
      const user = await this.userRepository
        .createQueryBuilder('users')
        .select([
          'users.id',
          'users.role',
          'users.email',
          'users.password',
          'users.walletAddress',
          'users.activationCodeId',
        ])
        .where(`users.email = :email`, { email })
        .getOne();

      if (!user) {
        throw new NotFoundException('User does not exist');
      }
      const checkPassword = await comparePassword(
        loginByPasswordDto.password,
        user.password
      );
      if (!checkPassword) {
        throw new ForbiddenException('Invalid credentials. Please try again');
      }
      if (!user.activationCodeId) {
        return await this.returnLoginData(req, email, false);
      }
      return await this.returnLoginData(req, email, true);
    } catch (error) {
      this.logger.error(error, `loginByPassword`, 'AuthService');
      exceptionHandler(error);
    }
  }

  async logoutByUserId(userId: number) {
    try {
      await this.loginSessionService.deleteTokenLoginSession(userId);
    } catch (error) {
      this.logger.error(error, `logoutByUserId(${userId})`, 'AuthService');
      exceptionHandler(error);
    }
  }

  async registerTwoFactorAuthentication(response: Response, user: User) {
    if (!user.walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    try {
      const userOtpInfo = await this.userOtpRepository.findOneBy({
        userId: user.id,
      });
      if (!userOtpInfo) {
        throw new InternalServerErrorException('userId not found');
      }

      const user2FAInfo = await this.userRepository.findOne({
        where: { id: user.id },
        select: ['isTwoFactorAuthenticationRegistered'],
      });

      if (user2FAInfo.isTwoFactorAuthenticationRegistered) {
        throw new BadRequestException(
          'Two factor authentication is already registered'
        );
      }

      const { secret, otpAuthUrl } =
        await this.generateTwoFactorAuthenticationSecret(user.walletAddress);

      await this.userOtpRepository.update(
        { userId: user.id },
        { twoFactorAuthenticationSecret: secret }
      );

      return this.pipeQrCodeStream(response, otpAuthUrl);
    } catch (error) {
      this.logger.error(error, `otpRegister`, 'AuthService');
      exceptionHandler(error);
    }
  }

  async confirmForRegisterTwoFactorAuthentication(
    code: string,
    userId: number
  ) {
    const isCodeValid = await this.isTwoFactorAuthenticationCodeValid(
      code,
      userId
    );
    if (!isCodeValid) {
      return { validCode: false, userId };
    }

    try {
      await this.userRepository.update(
        { id: userId },
        { isTwoFactorAuthenticationRegistered: true }
      );
    } catch (error) {
      this.logger.error(
        error,
        `confirmForRegisterTwoFactorAuthentication(${userId})`,
        'AuthService'
      );
      exceptionHandler(error);
    }

    return { validCode: true, userId };
  }

  async confirmTwoFactorAuthentication(code: string, userId: number) {
    try {
      const isEnabled = await this.userRepository.findOne({
        where: {
          id: userId,
          isTwoFactorAuthenticationEnabled: true,
          isTwoFactorAuthenticationRegistered: true,
        },
      });

      if (!isEnabled) {
        throw new BadRequestException(
          'Two factor authentication is not enabled or registered'
        );
      }
    } catch (error) {
      this.logger.error(
        error,
        `confirmTwoFactorAuthentication(${userId})`,
        'AuthService'
      );
      exceptionHandler(error);
    }

    const isCodeValid = await this.isTwoFactorAuthenticationCodeValid(
      code,
      userId
    );
    if (!isCodeValid) {
      return { validCode: false, userId };
    }

    return { validCode: true, userId };
  }

  async updateEnableStatusTwoFactorAuthentication(
    userId: number,
    targetStatus: boolean
  ) {
    try {
      const userOtpInfo = await this.userOtpRepository.findOne({
        where: { userId },
        select: ['twoFactorAuthenticationSecret'],
      });

      if (!userOtpInfo) {
        throw new BadRequestException(
          `Two factor authentication is not generated`
        );
      }

      const userInfo = await this.userRepository.findOne({
        where: { id: userId },
        select: ['isTwoFactorAuthenticationRegistered'],
      });

      if (
        !userInfo.isTwoFactorAuthenticationRegistered ||
        !userOtpInfo.twoFactorAuthenticationSecret
      ) {
        throw new BadRequestException(
          'Two factor authentication is not registered'
        );
      }

      await this.userRepository.update(
        { id: userId },
        { isTwoFactorAuthenticationEnabled: targetStatus }
      );
    } catch (error) {
      this.logger.error(
        error,
        `updateStatusTwoFactorAuthentication`,
        'AuthService'
      );
      exceptionHandler(error);
    }
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto) {
    try {
      const { email, password, otp } = updatePasswordDto;

      if (!email || !password || !otp) {
        throw new BadRequestException('password or otp is required');
      }

      const userOtp = await this.userOtpService.findByEmailAndOtp({
        otp,
        email,
      });

      if (!userOtp) {
        throw new NotFoundException('OTP is invalid. Please try again');
      }

      if (userOtp.expiredAt.isBefore(LocalDateTime.now())) {
        throw new BadRequestException('OTP is expired. Please try again');
      }

      const user = await this.userRepository.findOneBy({ email });
      if (!user) {
        throw new NotFoundException('User does not exist');
      }
      const hashpassword = await hashPassword(password);

      user.password = hashpassword;
      await user.save();
    } catch (error) {
      this.logger.error(error, `updatePassword`, 'AuthService');
      exceptionHandler(error);
    }
  }

  private generateResponseLoginData(
    user: User,
    status?: boolean
  ): LoginResponseData {
    let accessToken: string;
    let refreshToken: string;
    let userData;
    try {
      userData = { ...user, status };
      delete userData.password;
      accessToken = generateAccessJWT(userData, {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRE_IN_SEC),
      });
      refreshToken = generateRefreshJWT(userData, {
        expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRE_IN_SEC),
      });
      return {
        userData,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(
        error,
        `generateResponseLoginData(${user})`,
        'AuthService'
      );
      exceptionHandler(error);
    }
  }

  async generateNewAccessJWTWithRefreshToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<GenerateAccessJWTData> {
    const refreshToken = refreshTokenDto.refreshToken;
    let payload;
    let sessionLogin;
    try {
      payload = verifyRefreshJWT(refreshToken);
      const user = await this.userRepository.findOneBy({ id: payload.id });

      sessionLogin = await this.loginSessionService.findLoginSessionByUserId(
        user.id
      );

      if (sessionLogin?.refreshToken !== refreshToken) {
        throw new UnauthorizedException('jwt expired');
      }

      delete payload.exp;
      delete payload.iat;

      const accessToken = generateAccessJWT(payload, {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRE_IN_SEC),
      });

      sessionLogin.accessToken = accessToken;
      await sessionLogin.save();

      return { accessToken };
    } catch (error) {
      this.logger.error(error, `generateNewAccessJWT`, 'AuthService');
      exceptionHandler(error);
    }
  }

  private async generateTwoFactorAuthenticationSecret(walletAddress: string) {
    const secret = this.otpService.generateSecret();
    const otpAuthUrl = this.otpService.keyUri(walletAddress, secret);

    return {
      secret,
      otpAuthUrl,
    };
  }

  private async pipeQrCodeStream(stream: Response, otpAuthUrl: string) {
    const qrStream = this.qrCodeService.getPassThrough();
    stream = this.qrCodeService.setHeader(stream, 'Content-Type', 'image/png');

    await this.qrCodeService.toFileStream(qrStream, otpAuthUrl);

    return this.qrCodeService.pipe(stream, qrStream);
  }

  private async isTwoFactorAuthenticationCodeValid(
    code: string,
    userId: number
  ) {
    try {
      const secret = await this.userOtpRepository.findOne({
        where: { userId },
        select: ['twoFactorAuthenticationSecret'],
      });

      if (!secret) {
        throw new NotFoundException(
          'twoFactorAuthenticationSecret is not exist'
        );
      }

      return this.otpService.verify(code, secret.twoFactorAuthenticationSecret);
    } catch (error) {
      this.logger.error(
        error,
        `isTwoFactorAuthenticationCodeValid`,
        'AuthService'
      );
      exceptionHandler(error);
    }
  }
  // async resendEmailLoginOtp({ email }: ResendOtpDto): Promise<SendOtpData> {
  //   const otp = this.userOtpService.generateDigitOtp();
  //   const expiredTime = this.userOtpService.getOtpTimeOut();

  //   await this.userOtpService.findOneAndUpdateOpt(email, otp, expiredTime);

  //   this.emailService.sendOtpVerificationEmail({ email, otp });

  //   return {
  //     otpSent: true,
  //   };
  // }

  // async activeActivationCode(
  //   req: Request,
  //   activeActivationCodeDto: ActiveActivationCodeDto
  // ): Promise<LoginResponseData> {
  //   const { email, activationCode, otp, password } = activeActivationCodeDto;
  //   if (!otp && !password) {
  //     throw new HttpException(
  //       'Otp or password is required',
  //       HttpStatus.BAD_REQUEST
  //     );
  //   }

  //   if (otp && password) {
  //     throw new HttpException(
  //       'Only otp or password is required',
  //       HttpStatus.BAD_REQUEST
  //     );
  //   }

  //   if (otp) {
  //     return await this.activeActivationCodeByOtp({
  //       req,
  //       email,
  //       activationCode,
  //       otp,
  //     });
  //   }

  //   if (password) {
  //     return await this.activeActivationCodeByPassword({
  //       req,
  //       email,
  //       activationCode,
  //       password,
  //     });
  //   }
  // }

  // async activeActivationCodeByOtp({
  //   req,
  //   email,
  //   activationCode,
  //   otp,
  // }): Promise<any> {
  //   // check otp
  //   const userOtp = await this.userOtpService.findByEmailAndOtp({
  //     otp,
  //     email,
  //   });

  //   if (!userOtp) {
  //     throw new HttpException(
  //       'OTP is invalid. Please try again',
  //       HttpStatus.NOT_FOUND
  //     );
  //   }

  //   const currentActivationCode =
  //     await this.activationCodeService.getActivationCodebyCode(activationCode);

  //   if (!currentActivationCode) {
  //     throw new HttpException(
  //       'Activation code does not exist. Please try again',
  //       HttpStatus.NOT_FOUND
  //     );
  //   }

  //   if (currentActivationCode.register) {
  //     throw new HttpException(
  //       'Activation code is registered. Please try again',
  //       HttpStatus.BAD_REQUEST
  //     );
  //   }

  //   let user = await this.userRepository.findOneBy({ email });

  //   if (!user) {
  //     // create new User with activation code
  //     user = await this.userRepository.create({
  //       email,
  //       activationCodeId: currentActivationCode.id,
  //     });
  //     await user.save();
  //   } else {
  //     // active activation code
  //     user.activationCodeId = currentActivationCode.id;
  //     await user.save();
  //   }

  //   currentActivationCode.register = user.id;
  //   await currentActivationCode.save();

  //   const { userData, accessToken, refreshToken } =
  //     this.generateResponseLoginData(user);

  //   const { device, ip } = getDeviceAndIpInformation(req);

  //   await this.loginSessionService.findOneAndUpdateLoginSession({
  //     userId: user.id,
  //     accessToken,
  //     refreshToken,
  //     device,
  //     ip,
  //   });

  //   return {
  //     userData,
  //     accessToken,
  //     refreshToken,
  //   };
  // }

  // async activeActivationCodeByPassword({
  //   req,
  //   email,
  //   activationCode,
  //   password,
  // }): Promise<LoginResponseData> {
  //   // check password
  //   const user = await this.userRepository.findOneBy({
  //     email,
  //   });

  //   if (!user) {
  //     throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
  //   }

  //   const checkPassword = await comparePassword(password, user.password);
  //   if (!checkPassword) {
  //     throw new HttpException(
  //       'Invalid credentials. Please try again',
  //       HttpStatus.FORBIDDEN
  //     );
  //   }

  //   const currentActivationCode =
  //     await this.activationCodeService.getActivationCodebyCode(activationCode);

  //   if (!currentActivationCode) {
  //     throw new HttpException(
  //       'Activation code does not exist. Please try again',
  //       HttpStatus.NOT_FOUND
  //     );
  //   }

  //   if (currentActivationCode.register) {
  //     throw new HttpException(
  //       'Activation code is registered. Please try again',
  //       HttpStatus.BAD_REQUEST
  //     );
  //   }

  //   // active activation code
  //   user.activationCodeId = currentActivationCode.id;
  //   await user.save();

  //   currentActivationCode.register = user.id;
  //   await currentActivationCode.save();

  //   const { userData, accessToken, refreshToken } =
  //     this.generateResponseLoginData(user);

  //   const { device, ip } = getDeviceAndIpInformation(req);

  //   await this.loginSessionService.findOneAndUpdateLoginSession({
  //     userId: user.id,
  //     accessToken,
  //     refreshToken,
  //     device,
  //     ip,
  //   });

  //   return {
  //     userData,
  //     accessToken,
  //     refreshToken,
  //   };
  // }
}
