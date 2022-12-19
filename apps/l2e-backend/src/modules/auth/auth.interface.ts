import { User } from '@libs/l2e-queries/entities';

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  userData: User;
}

export interface GenerateAccessJWTData {
  accessToken: string;
}
export interface SendOtpData {
  otpSent: boolean;
}
