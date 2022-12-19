import { LocalDateTime } from '@js-joda/core';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsArray,
} from 'class-validator';
import { TokenSymbol } from '../common';

export class CostDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'BLB',
  })
  tokenSymbol: TokenSymbol;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 10,
  })
  requiredCost: number;
}

export class RequiredCosts {
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    example: [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: 10,
      },
    ],
  })
  costs: CostDto[];
}

export class HeadphoneLevelUpCostsAndTimeDto {
  @IsDate()
  @IsNotEmpty()
  @ApiProperty({
    example: '2022-08-10 09:49:28',
  })
  levelUpCompletionTime: LocalDateTime;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    example: [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: 10,
      },
    ],
  })
  costs: CostDto[];
}

export class HeadphoneLevelUpStats {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 4,
  })
  levelUpStatCount: number;
}
