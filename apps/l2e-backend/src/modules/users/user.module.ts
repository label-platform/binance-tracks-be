import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@users/user.controller';
import { UserService } from '@users/user.service';
import { SpendingBalance, User } from '@libs/l2e-queries/entities';

const ImportedModels = TypeOrmModule.forFeature([User, SpendingBalance]);

@Module({
  imports: [ImportedModels],
  exports: [UserService, ImportedModels],
  controllers: [UserController],
  providers: [UserService, Logger],
})
export class UserModule {}
