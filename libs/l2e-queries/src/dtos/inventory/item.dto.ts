import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemStatus, ItemType } from '../common';


export class ItemDto {
  // @IsNumber()
  // @IsOptional()
  // @ApiProperty({
  //   example: 1,
  // })
  // id: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  userId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'https://i.imgur.com/XqQXQ.png',
  })
  imgUrl: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  nftId: number;

  @IsEnum(ItemType)
  @IsOptional()
  @ApiProperty({
    enum: ItemType,
  })
  type: ItemType

  @IsEnum(ItemStatus)
  @IsOptional()
  @ApiProperty({
    enum: ItemStatus,
  })
  status: ItemStatus
}