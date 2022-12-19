import { PageOptionsDto } from '@libs/l2e-pagination/dtos';
import {
  CreatePlaylistCategoryDto,
  PlaylistDto,
  UpdatePlaylistCategoryDto,
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
import { PlaylistCategoryService } from './playlist-category.service';

@Controller('playlist-categories')
@ApiTags('playlist-categories')
export class PlaylistCategoryController {
  constructor(
    private readonly playlistCategoryService: PlaylistCategoryService
  ) {}
  @Post('')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPlaylistCategory(
    @Body() createPlaylistCategoryDto: CreatePlaylistCategoryDto
  ) {
    const data = await this.playlistCategoryService.createPlaylistCategory(
      createPlaylistCategoryDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchPlaylistCategory(@Query() pageOptionsDto: PageOptionsDto) {
    const data = await this.playlistCategoryService.fetchPlaylistCategory(
      pageOptionsDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get(':playlistCategoryId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchPlaylistCategoryById(
    @Param('playlistCategoryId') playlistCategoryId: number,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const data = await this.playlistCategoryService.fetchPlaylistCategoryById(
      pageOptionsDto,
      playlistCategoryId
    );
    return {
      success: true,
      content: data,
    };
  }

  @Patch('')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePlaylistCategory(
    @Body() updatePlaylistCategoryDto: UpdatePlaylistCategoryDto
  ) {
    const data = await this.playlistCategoryService.updatePlaylistCategory(
      updatePlaylistCategoryDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Post('add-playlist')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addPlaylist(@Body() addPlaylistDto: PlaylistDto) {
    const data = await this.playlistCategoryService.addPlaylist(addPlaylistDto);
    return {
      success: true,
      content: data,
    };
  }
  @Post('subtract-playlist')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async subtractPlaylist(@Body() subtractPlaylistDto: PlaylistDto) {
    const data = await this.playlistCategoryService.subtractPlaylist(
      subtractPlaylistDto
    );
    return {
      success: true,
      content: data,
    };
  }

  @Delete(':playlistCategoryId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePlaylistCategory(
    @Param('playlistCategoryId') playlistCategoryId: number
  ) {
    await this.playlistCategoryService.deletePlaylistCategory(
      playlistCategoryId
    );
    return {
      success: true,
    };
  }
}
