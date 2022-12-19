import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsObject,
} from 'class-validator';
import {
  Headphone,
  HeadphoneBox,
  MysteryBox,
  Pinballhead,
  Sticker,
} from '../entities';
import { BalanceCheckPurpose, ItemType } from './common';
import { CostDto, RequiredCosts } from './inventory';

export class SpendingBalanceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'BLB',
  })
  tokenSymbol: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 10,
  })
  balance: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 9,
  })
  availableBalance: number;
}

export class UserSpendingBalanceDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  id: number;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'BLB',
  })
  tokenSymbol: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 10,
  })
  balance: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 9,
  })
  availableBalance: number;
}

export class ItemInfoForBalanceCheck {
  @IsEnum(ItemType)
  @IsNotEmpty()
  @ApiProperty({
    enum: ItemType,
  })
  type: ItemType;

  @IsEnum(BalanceCheckPurpose)
  @IsNotEmpty()
  @ApiProperty({
    enum: BalanceCheckPurpose,
  })
  purpose: BalanceCheckPurpose;

  @IsObject()
  @IsNotEmpty()
  items:
    | Headphone
    | Headphone[]
    | HeadphoneBox
    | Sticker
    | Sticker[]
    | MysteryBox
    | Pinballhead;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({
    type: RequiredCosts,
  })
  requiredCosts: RequiredCosts | CostDto[];
}
