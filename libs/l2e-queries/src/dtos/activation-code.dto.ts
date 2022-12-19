import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsNotEmpty, Length } from 'class-validator';

export class CreateActivationCodeDto {
  @IsNumberString()
  @Length(8, 8)
  @ApiProperty({
    example: '12345678',
  })
  code: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  owner: number;
}
