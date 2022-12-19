import { Logger, Module } from '@nestjs/common';
import { UserModule } from '@users/user.module';
import { ActivationCodeController } from '@activation-codes/activation-code.controller';
import { ActivationCodeService } from '@activation-codes/activation-code.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivationCode } from '@libs/l2e-queries/entities';

const ActivationCodeModel = TypeOrmModule.forFeature([ActivationCode]);

@Module({
  imports: [ActivationCodeModel, UserModule],
  exports: [ActivationCodeService],
  controllers: [ActivationCodeController],
  providers: [ActivationCodeService, Logger],
})
export class ActivationCodeModule {}
