import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { MysteryBoxQuality } from '../common';
import { ItemDto } from './item.dto';

export class MysteryBoxDto {
  @IsEnum(MysteryBoxQuality)
  @IsOptional()
  @ApiProperty({ enum: MysteryBoxQuality })
  quality: MysteryBoxQuality;

  @IsDate()
  @IsOptional()
  @ApiProperty({
    example: '2022-08-09T00:00:00Z',
  })
  openingTimeCountdown: Date;
}

export class CreateMysteryBoxDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 12974,
  })
  headphoneId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 3,
  })
  energyConsumption: number;
}

export class UpdateMysteryBoxDto {
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
  @ApiProperty({ type: MysteryBoxDto })
  mysteryBox: MysteryBoxDto;
}

export class OpenMysteryBoxDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  mysteryBoxId: number;
}
