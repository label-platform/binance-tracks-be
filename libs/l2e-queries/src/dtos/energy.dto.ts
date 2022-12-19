import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class EnergyResponseDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ type: 'number', example: 1 })
  availableEnergy: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ type: 'number', example: 1 })
  energyCap: number;
}
