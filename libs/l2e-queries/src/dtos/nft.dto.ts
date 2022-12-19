import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEthereumAddress } from 'class-validator';

export class CreateNftDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  @ApiProperty({
    example: '0xA22AE19c86cfd889A128B857244Acb7c1ABd3EE3',
  })
  collectionAddress: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  tokenId: number;
}
