import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class EarningSocketDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  songId: number

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 100,
  })
  playTime: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '2022-10-03 16:49:51.095608',
  })
  startTime: Date;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  headphoneId: number
}
