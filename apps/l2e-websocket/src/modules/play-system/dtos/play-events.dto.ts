import {IsNumber, IsOptional, IsString, IsUUID} from 'class-validator';

export class PlayEventDto {
  @IsNumber()
  headphoneId?: number;

  @IsNumber()
  songId: number;

  @IsOptional()
  @IsNumber()
  playTime: number;
}
