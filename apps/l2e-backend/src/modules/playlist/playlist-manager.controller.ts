import { PageOptionsDto } from '@libs/l2e-pagination/dtos';
import {
  CreatePlaylistDto,
  SongDto,
  UpdatePlaylistDto,
} from '@libs/l2e-queries/dtos';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@src/cores/decorators/role.decorator';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { RolesGuard } from '@src/cores/guards/roles.guard';
import { PlaylistManagerService } from './playlist-manager.service';

@Controller('playlist-manager')
@ApiTags('playlist-manager')
export class PlaylistManagerController {
  constructor(
    private readonly playlistManagerService: PlaylistManagerService
  ) {}
  @Post('playlist')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPlaylist(@Body() createPlaylistDto: CreatePlaylistDto) {
    const data = await this.playlistManagerService.createPlaylist(
      createPlaylistDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get('playlist')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchPlaylist(@Query() pageOptionsDto: PageOptionsDto) {
    const data = await this.playlistManagerService.fetchPlaylist(
      pageOptionsDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get('playlist/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchPlaylistById(
    @Param('id') id: number,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const data = await this.playlistManagerService.fetchPlaylistById(
      pageOptionsDto,
      id
    );
    return {
      success: true,
      content: data,
    };
  }

  @Patch('playlist/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePalylist(
    @Param('id') id: number,
    @Body() updatePlaylistDto: UpdatePlaylistDto
  ) {
    const data = await this.playlistManagerService.updatePlaylist(
      updatePlaylistDto,
      id
    );
    return {
      success: true,
      content: data,
    };
  }

  @Post('add-song')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addSong(@Body() addSongDto: SongDto) {
    const data = await this.playlistManagerService.addSongs(addSongDto);
    return {
      success: true,
      content: data,
    };
  }
  @Post('subtract-song')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async subtractSong(@Body() subtractSongDto: SongDto) {
    const data = await this.playlistManagerService.subtractSongs(
      subtractSongDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Delete('playlist/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePlaylist(@Param('id') id: number) {
    await this.playlistManagerService.deletePlaylist(id);
    return {
      success: true,
    };
  }
}
