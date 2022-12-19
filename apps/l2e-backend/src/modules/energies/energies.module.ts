import { Logger, Module } from '@nestjs/common';
import { EnergiesService } from './energies.service';
import { EnergiesController } from './energies.controller';
import { Item, Headphone, User } from '@libs/l2e-queries/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

const ImportedModels = TypeOrmModule.forFeature([Item, Headphone, User]);

@Module({
  imports: [ImportedModels],
  controllers: [EnergiesController],
  providers: [EnergiesService, Logger],
  exports: [EnergiesService],
})
export class EnergiesModule {}
