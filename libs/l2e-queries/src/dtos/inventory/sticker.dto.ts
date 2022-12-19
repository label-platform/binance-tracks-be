import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Attribute } from '../common';
import { ItemDto } from './item.dto';

export class StickerDto {
  @IsEnum(Attribute)
  @IsOptional()
  @ApiProperty({ enum: Attribute })
  attribute: Attribute;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  level: number;
}

export class CreateStickerDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;
}

export class UpdateStickerDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  id: number;

  @IsOptional()
  @ApiProperty({ type: ItemDto })
  item: ItemDto;

  @IsOptional()
  @ApiProperty({ type: StickerDto })
  sticker: StickerDto;
}

export class InsertStickerRequestDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneDockPosition: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  stickerId: number;
}

export class EnhanceStickerRequestDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  stickerOneId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 2,
  })
  stickerTwoId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 3,
  })
  stickerThreeId: number;
}
