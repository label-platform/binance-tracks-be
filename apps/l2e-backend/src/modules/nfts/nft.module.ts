import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftService } from '@nfts/nft.service';
import { Nft } from '@libs/l2e-queries/entities';
import { NftController } from '@nfts/nft.controller';
import { UserModule } from '@users/index';

const NftModel = TypeOrmModule.forFeature([Nft]);

@Module({
  imports: [NftModel, UserModule],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
