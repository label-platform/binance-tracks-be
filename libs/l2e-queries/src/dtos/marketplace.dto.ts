import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Attribute, ItemTypeFilter as ItemTypeFilter, Quality } from './common';

export class SellDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  itemId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 100 })
  price: number;
}
export class UpdateSellingItemDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 100 })
  price: number;
}
export class StickerFilterDto {
  @IsEnum(Attribute)
  @IsOptional()
  @ApiProperty({ enum: Attribute })
  attribute: Attribute;

  @IsOptional()
  @ApiProperty({ example: 8 })
  levelLessThen: string;

  @IsOptional()
  @ApiProperty({ example: 0 })
  levelMoreThen: string;
}

export class HeadphoneOrHeadphoneBoxFilterDto {
  @IsEnum(ItemTypeFilter)
  @IsNotEmpty()
  @ApiProperty({ enum: ItemTypeFilter, default: ItemTypeFilter.HEADPHONE })
  type: ItemTypeFilter;

  @IsEnum(Quality)
  @IsOptional()
  @ApiProperty({ enum: Quality })
  quality: Quality;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '8' })
  mintLessThen: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '0' })
  mintMoreThen: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '31' })
  levelLessThen: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '0' })
  levelMoreThen: string;
}
