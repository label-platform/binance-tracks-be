import { PageOptionsDto } from '@libs/l2e-pagination/dtos';
import {
  FileSignedUrlDto,
  UpdateSongDto,
  UploadSongDto,
} from '@libs/l2e-queries/dtos';
import { User } from '@libs/l2e-queries/entities';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { SongManagementService } from './song-management.service';

@Controller('song-management')
@ApiTags('song-management')
export class SongManagementController {
  constructor(private readonly songManagementService: SongManagementService) {}

  @Post('signedUrl')
  async getSignedUrlForProduct(@Body() fileSignedUrlDto: FileSignedUrlDto) {
    const data = await this.songManagementService.getSignedUrlForProduct(
      fileSignedUrlDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  async uploadSong(@Body() uploadSongDto: UploadSongDto) {
    const data = await this.songManagementService.uploadSong(uploadSongDto);
    return {
      success: true,
      content: data,
    };
  }

  @Get('songs')
  @UseGuards(JwtAuthGuard)
  async fetchSong(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const data = await this.songManagementService.fetchSong(
      pageOptionsDto,
      user.id
    );
    return {
      success: true,
      content: data,
    };
  }
  @Post('cancel/:songId')
  @UseGuards(JwtAuthGuard)
  async concelUploadSong(
    @UserScope() user: User,
    @Param('songId') songId: number
  ) {
    await this.songManagementService.cancelUploadSong(songId, user.id);
    return {
      success: true,
    };
  }
  @Post('update/:songId')
  @UseGuards(JwtAuthGuard)
  async updateUploadSong(
    @Param('songId') songId: number,
    @Body() updateSongDto: UpdateSongDto,
    @UserScope() user: User
  ) {
    const data = await this.songManagementService.updateUploadSong(
      updateSongDto,
      songId,
      user.id
    );
    return { success: true, content: data };
  }
}
