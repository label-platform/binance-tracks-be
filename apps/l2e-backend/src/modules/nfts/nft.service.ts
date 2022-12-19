import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateNftDto } from '@libs/l2e-queries/dtos';
import { Nft } from '@libs/l2e-queries/entities';
import { NftRepository } from '@libs/l2e-queries/repositories';

@Injectable()
export class NftService {
  constructor(
    @InjectRepository(Nft)
    private readonly nftRepository: NftRepository
  ) {}

  async create(createNftDto: CreateNftDto): Promise<Nft> {
    try {
      const nft: Nft = await this.nftRepository.findOneBy({
        collectionAddress: createNftDto.collectionAddress,
        tokenId: createNftDto.tokenId,
      });

      if (nft) {
        throw new HttpException(
          'Nft is already created. Please try again',
          HttpStatus.CONFLICT
        );
      }

      const createdNft: Nft = await this.nftRepository.create(createNftDto);

      await this.nftRepository.save(createNftDto);
      return createdNft;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNftById(id: number): Promise<Nft> {
    const nft = await this.nftRepository.findOne({
      where: {
        id,
      },
      relations: ['owner'],
    });
    if (!nft) {
      throw new HttpException(
        'Nft does not exist. Please try again',
        HttpStatus.NOT_FOUND
      );
    }

    return nft;
  }
}
