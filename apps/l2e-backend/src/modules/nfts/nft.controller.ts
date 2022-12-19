import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NftService } from '@nfts/nft.service';
import { CreateNftDto } from '@libs/l2e-queries/dtos';
import { Param } from '@nestjs/common';

@Controller('nfts')
@ApiTags('nfts')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateNftDto) {
    const createdUser = await this.nftService.create(createUserDto);

    return {
      success: true,
      content: createdUser,
    };
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getNftById(@Param('id') id: number) {
    const nft = await this.nftService.getNftById(id);

    return {
      success: true,
      content: nft,
    };
  }
}
