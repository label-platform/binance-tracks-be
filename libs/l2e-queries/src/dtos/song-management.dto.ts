import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class FileSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'audio/wav' })
  contentType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CHEERUP' })
  fileName: string;
}
export class UploadSongDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  ownerId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CHEERUP' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'f844f19f-19a8-4766-a08c-b100580f51ec-CHEERUP' })
  s3name: string;

  @IsString()
  @ApiProperty({ example: 'This song is good' })
  description: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ example: [1, 2, 3] })
  genreIds: number[];

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 1 })
  albumId: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({ example: [1, 2, 3] })
  artistIds: number[];
}

export class UpdateSongDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CHEERUP' })
  name: string;

  @IsString()
  @ApiProperty({ example: 'This song is good' })
  description: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ example: [1, 2, 3] })
  genreIds: number[];

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 1 })
  albumId: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({ example: [1, 2, 3] })
  artistIds: number[];
}
