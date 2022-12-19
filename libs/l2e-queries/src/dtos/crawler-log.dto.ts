import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEthereumAddress } from 'class-validator';

export class CreateCrawlerLogDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  no: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 88888,
  })
  fromBlock: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 99999,
  })
  toBlock: number;

  @IsEthereumAddress()
  @IsNotEmpty()
  @ApiProperty({
    example: '0x9b500a4B354914d420c3D1497AEe4Ba9d45b7Df0',
  })
  contractAddress: string;
}
