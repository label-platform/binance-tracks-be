import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Display } from './common';

export class CreatePlaylistDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'autumn song collection' })
  playlistName: string;

  @IsString()
  @ApiProperty({ example: 'songimg' })
  playlistImg: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  playlistOrder: number;
}

export class SongDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  playlistId: number;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  songIds: number[];
}

export class UpdatePlaylistDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 1 })
  playlistOrder: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'https://prod-tracks.s3.amazonaws.com/musics/test-playlist-img.png"',
  })
  playlistImg: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'autumn song collection' })
  playlistName: string;

  @IsEnum(Display)
  @IsOptional()
  @ApiProperty({ example: Display })
  playlistDisplay: Display;
}
