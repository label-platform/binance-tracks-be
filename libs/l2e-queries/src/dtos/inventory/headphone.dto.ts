import { Item } from '../../entities';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Quality } from '../common';
import { ItemDto } from './item.dto';

export class HeadphoneDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number | Item;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  parentId1?: number | Item;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 2,
  })
  parentId2?: number | Item;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  baseLuck?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  levelLuck?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  itemLuck?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  luck?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  baseEfficiency?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  levelEfficiency?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  itemEfficiency?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  efficiency?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  baseComfort?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  levelComfort?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  itemComfort?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  comfort?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  baseResilience?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  levelResilience?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  itemResilience?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1.1,
  })
  resilience?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 100,
  })
  battery?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  level?: number;

  @IsEnum(Quality)
  @IsOptional()
  @ApiProperty({
    example: 100,
  })
  quality?: Quality;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 0,
  })
  mintCount?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 0,
  })
  availableMintCount?: number;

  @IsDate()
  @IsOptional()
  @ApiProperty({
    example: 0,
  })
  levelUpCompletionTime?: Date;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 0,
  })
  remainedStat?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'https://example.com/image.png',
  })
  imgUrl?: string;
}

export class CreateHeadphoneDto {
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
  createdHeadphone: HeadphoneDto;
}

export class UpdateHeadphoneDto {
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
  @ApiProperty({ type: HeadphoneDto })
  headphone: HeadphoneDto;
}

export class LevelUpHeadphoneDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;
}

export class BoostLevelUpHeadphoneDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;
}

export class StatUpHeadphoneDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  efficiency: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  comfort: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  resilience: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    example: 1,
  })
  luck: number;
}

export class MountHeadphoneDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;
}

export class MintHeadphoneDto {
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    example: [1, 2],
  })
  headphoneIds: number[];
}

export class CooldownCompleteHeadphoneDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;
}

export class ChargeHeadphoneRequestDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 10,
  })
  chargingAmount?: number;
}

export class reduceHeadphoneBatteryDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number;

  //calculated in second
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 10.0,
  })
  timeListened?: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;

}

export class OpenHeadphoneDockDto {
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
  position: number;
}

