import { Module } from '@nestjs/common';
import { LoginSession } from '@libs/l2e-queries/entities';
import { LoginSessionService } from '@login-sessions/login-session.service';
import { TypeOrmModule } from '@nestjs/typeorm';

const LoginSessioModel = TypeOrmModule.forFeature([LoginSession]);

@Module({
  imports: [LoginSessioModel],
  providers: [LoginSessionService],
  exports: [LoginSessionService],
})
export class LoginSessionModule {}
