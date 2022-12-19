import { Item } from '../../entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Quality } from '../common';
import { ItemDto } from './item.dto';

export class HeadphoneBoxDto {
  @IsEnum(Quality)
  @IsOptional()
  @ApiProperty({ enum: Quality })
  quality: Quality;
}

export class CreateHeadphoneBoxDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  parentId1: number | Item;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 2,
  })
  parentId2: number | Item;
}

export class UpdateHeadphoneBoxDto {
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
  @ApiProperty({ type: HeadphoneBoxDto })
  headphoneBox: HeadphoneBoxDto;
}

export class OpenHeadphoneBoxDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneBoxId: number;
}
