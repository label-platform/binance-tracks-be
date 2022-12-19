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

export class CreatePlaylistCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'test playlist category' })
  categoryName: string;

  @IsString()
  @ApiProperty({
    example:
      'https://prod-tracks.s3.amazonaws.com/musics/test-playlist-img.png',
  })
  categoryImg: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  categoryOrder: number;
}

export class PlaylistDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  playlistCategoryId: number;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty({ example: [1] })
  playlistIds: number[];
}

export class UpdatePlaylistCategoryDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  playlistCategoryId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 1 })
  categoryOrder: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'https://prod-tracks.s3.amazonaws.com/musics/test-playlist-img.png',
  })
  categoryImg: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'autumn song collection' })
  categoryName: string;

  @IsEnum(Display)
  @IsOptional()
  @ApiProperty({ example: Display })
  categoryDisplay: Display;
}
