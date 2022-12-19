import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemDto } from './item.dto';

export class PinballheadDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  })
  description: string;
}

export class CreatePinballheadDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  })
  description: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'https://i.imgur.com/XqQXQ.png',
  })
  imgUrl: string;
}

export class UpdatePinballheadDto {
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
  @ApiProperty({ type: PinballheadDto })
  pinballhead: PinballheadDto;
}
