import { Headphone, HeadphoneDock } from '@libs/l2e-queries/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliciesService } from './policies.service';

const inventory = TypeOrmModule.forFeature([Headphone, HeadphoneDock]);
@Module({
  imports: [inventory],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
