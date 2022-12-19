import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsEthereumAddress,
} from 'class-validator';
import { ItemType, TokenSymbol, WithdrawStatus, WithdrawType } from './common';

export class CreateWithdrawTokenDto {
  @IsEnum(TokenSymbol)
  @IsNotEmpty()
  @ApiProperty({ example: TokenSymbol.BNB })
  tokenSymbol: TokenSymbol;

  @IsNumberString()
  @ApiProperty({ example: '10' })
  amount: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      '0x22a7fb441626a2feb439e3cff4662c08688d35765726413d485d454446db45fb2c7b210960472e4a81e50b191f9198ef7be8f77018f803fba83fbc1ed287a3131b',
  })
  signedMessage: string;
}

export class CreateWithdrawNftDto {
  @IsEnum(ItemType)
  @IsNotEmpty()
  @ApiProperty({ example: ItemType.HEADPHONE })
  itemType: ItemType;

  @IsNumber()
  @ApiProperty({ example: 10 })
  itemId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      '0x22a7fb441626a2feb439e3cff4662c08688d35765726413d485d454446db45fb2c7b210960472e4a81e50b191f9198ef7be8f77018f803fba83fbc1ed287a3131b',
  })
  signedMessage: string;
}

export class WithdrawHistoriesFilterDto {
  @IsEnum(WithdrawType)
  @IsOptional()
  @ApiProperty({ example: WithdrawType.TOKEN })
  withdrawType: WithdrawType;

  @IsEnum(WithdrawStatus)
  @IsOptional()
  @ApiProperty({ example: WithdrawStatus.SUCCESS })
  withdrawStatus: WithdrawStatus;

  // @IsString()
  @IsEthereumAddress()
  @IsOptional()
  @ApiProperty({ example: '0x847b500692268587d7db3793f88e07ff52849376' })
  collectionAddress: string;

  @IsEthereumAddress()
  @IsOptional()
  @ApiProperty({ example: '0x4c17dbc1f2406886b63c463585226a8f04cec27e' })
  tokenAddress: string;
}
