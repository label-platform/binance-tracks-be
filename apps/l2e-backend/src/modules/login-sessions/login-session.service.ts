import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginSession } from '@libs/l2e-queries/entities';
import { CreateLoginSessionDto } from '@libs/l2e-queries/dtos';
import { LoginSessionRepository } from '@libs/l2e-queries/repositories';

@Injectable()
export class LoginSessionService {
  constructor(
    @InjectRepository(LoginSession)
    private readonly loginSessionRepository: LoginSessionRepository
  ) {}

  async findOneAndUpdateLoginSession(
    createLoginSessionDto: CreateLoginSessionDto
  ): Promise<void> {
    const { userId, accessToken, refreshToken, device, ip } =
      createLoginSessionDto;

    const loginSession = await this.loginSessionRepository.findOneBy({
      userId,
    });

    if (loginSession?.userId === userId) {
      await this.loginSessionRepository
        .createQueryBuilder()
        .update()
        .set({ accessToken, refreshToken, device, ip })
        .where('userId = :userId', { userId })
        .execute();
      return;
    }

    await this.loginSessionRepository.create(createLoginSessionDto).save();
    return;
  }

  async deleteTokenLoginSession(userId: number): Promise<void> {
    await this.loginSessionRepository
      .createQueryBuilder()
      .update()
      .set({ accessToken: null, refreshToken: null })
      .where('userId = :userId', { userId })
      .execute();
    return;
  }

  async findLoginSessionByUserId(userId: number): Promise<LoginSession> {
    return await this.loginSessionRepository.findOneBy({
      userId,
    });
  }
}
