import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEthereumAddress,
  Matches,
} from 'class-validator';
import { SpendingBalanceDto } from '.';
import { ActivationCode } from '../entities';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.]*$/, {
    message:
      'Only letters, digits, dots, and underscores are permitted in usernames. initial character must be a letter.',
  })
  @ApiProperty({
    example: 'nike',
  })
  username: string;
}

export class UpdateUserWalletAddressDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  // @Matches(/^(0x)?[0-9a-f]{40}$/i, { message: 'Invalid wallet address' })
  @ApiProperty({
    example: '0x9b500a4B354914d420c3D1497AEe4Ba9d45b7Df0',
  })
  walletAddress: string;
}

export class TokenEarningAmountDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 10.1,
  })
  tokenEarningAmount: number;
}

export class UserResponseDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  id: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'nike',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'listener',
  })
  role: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'cnh0912@gmail.com',
  })
  email: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  activationCodeId: number;

  @IsEthereumAddress()
  @IsNotEmpty()
  @ApiProperty({
    example: '0x9b500a4B354914d420c3D1497AEe4Ba9d45b7Df0',
  })
  walletAddress: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: [
      {
        id: 1,
        code: '01234567890123456789',
        owner: 1,
        register: 3,
      },
    ],
  })
  activationCodes: ActivationCode[];

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: [
      {
        tokenSymbol: 'BLB',
        balance: '10',
        availableBalance: '9',
      },
    ],
  })
  spendingBalances: SpendingBalanceDto[];
}
