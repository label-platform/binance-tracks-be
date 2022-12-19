import {
  FileSignedUrlDto,
  ItemType,
  SongStatus,
  UpdateSongDto,
  UploadSongDto,
} from '@libs/l2e-queries/dtos';
import {
  AlbumInfo,
  ArtistInfo,
  GenreInfo,
  Item,
  Song,
  SongArtist,
  SongGenre,
  User,
} from '@libs/l2e-queries/entities';
import {
  AlbumInfoRepository,
  ArtistInfoRepository,
  SongGenreRepository,
  SongArtistRepository,
  GenreInfoRepository,
  ItemRepository,
  SongRepository,
  UserRepository,
} from '@libs/l2e-queries/repositories';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exceptionHandler } from '@src/common/exception-handler';
import { DataSource } from 'typeorm';
import AWS from 'aws-sdk';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '@libs/l2e-pagination/dtos';
import { v4 as uuid } from 'uuid';
import { SongManagementUtilService } from './song-management-util.service';

const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET;
const s3 = new AWS.S3({
  signatureVersion: 'v4',
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_S3_REGION,
  useAccelerateEndpoint: true,
});
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
@Injectable()
export class SongManagementService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: SongRepository,
    @InjectRepository(Item)
    private readonly itemRepository: ItemRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @InjectRepository(AlbumInfo)
    private readonly albumInfoRepository: AlbumInfoRepository,
    @InjectRepository(ArtistInfo)
    private readonly artistInfoRepository: ArtistInfoRepository,
    @InjectRepository(GenreInfo)
    private readonly genreInfoRepository: GenreInfoRepository,
    @InjectRepository(SongGenre)
    private readonly songGenreRepository: SongGenreRepository,
    @InjectRepository(SongArtist)
    private readonly songArtistRepository: SongArtistRepository,
    @Inject(SongManagementUtilService)
    private readonly songManagementUtilService: SongManagementUtilService,
    private readonly dataSource: DataSource
  ) {}

  private async findPinballheadItem(itemId: number, userId: number) {
    const item = await this.itemRepository.findOne({
      relations: ['user'],
      where: { id: itemId, type: ItemType.PINBALLHEAD },
    });
    const user = item.user as User;
    if (userId !== user.id) throw new NotFoundException('do not own the item');
    return item;
  }

  async getSignedUrlForProduct(fileSignedUrlDto: FileSignedUrlDto) {
    try {
      const { contentType, fileName } = fileSignedUrlDto;
      const filetype: string = contentType.split('/')[1];
      const fileNameType = `${uuid()}-${fileName}.${filetype}`;

      const params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: fileNameType,
        Expires: 3600,
        ContentType: contentType,
        ACL: 'public-read',
      };
      const s3Url = await s3.getSignedUrlPromise('putObject', params);

      return {
        fileNameType,
        s3Url,
      };
    } catch (error) {
      exceptionHandler(error);
    }
    return;
  }

  async fetchSong(pageOptionsDto: PageOptionsDto, _userId: number) {
    try {
      const queryBuilder = this.songRepository
        .createQueryBuilder('song')
        .leftJoinAndSelect('song.owner', 'owner')
        .leftJoinAndSelect('song.artists', 'artists')
        .leftJoinAndSelect('artists.artistInfo', 'artistInfo');
      // .where('song.status = :status', { status: SongStatus.UPLOAD })
      // .andWhere('owner = :userId', { userId: userId });

      queryBuilder
        .orderBy('song.updatedAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

      return new PageDto(entities, pageMetaDto);
    } catch (error) {
      exceptionHandler(error);
    }
  }

  async uploadSong(uploadSongDto: UploadSongDto) {
    try {
      const {
        ownerId,
        name,
        description,
        s3name,
        genreIds,
        albumId,
        artistIds,
      } = uploadSongDto;

      const owner = await this.userRepository.findOneBy({ id: ownerId });
      if (!owner) throw new NotFoundException('owner does not exist');

      const checkPromises = [];

      if (artistIds) {
        // check if artists exists
        artistIds.forEach((artistId) => {
          const checkArtistsPromise = new Promise((_resolve, _reject) => {
            const artist = this.artistInfoRepository.findOneBy({
              id: artistId,
            });
            if (!artist) throw new NotFoundException('artist does not exist');
          });
          checkPromises.push(checkArtistsPromise);
        });
      }

      if (albumId) {
        // check if album exists
        const checkAlbumPromise = new Promise((_resolve, _reject) => {
          const album = this.albumInfoRepository.findOneBy({ id: albumId });
          if (!album) throw new NotFoundException('album does not exist');
        });
        checkPromises.push(checkAlbumPromise);
      }

      if (genreIds) {
        // check if genre exists
        genreIds.forEach((genreId) => {
          const checkGenrePromise = new Promise((_resolve, _reject) => {
            const genre = this.genreInfoRepository.findOneBy({ id: genreId });
            if (!genre) throw new NotFoundException('genre does not exist');
          });
          checkPromises.push(checkGenrePromise);
        });
      }

      await Promise.all(checkPromises);

      await this.dataSource.transaction(async (manager) => {
        const newSong = this.songRepository.create({
          owner: ownerId,
          name,
          description,
          s3name,
          status: SongStatus.UPLOAD,
          album: albumId,
        });

        await manager.save(newSong);

        const savePromises = [];
        if (artistIds) {
          artistIds.forEach((artistId) => {
            const newSongArtist = this.songArtistRepository.create({
              song: newSong.id,
              artistInfo: artistId,
            });
            savePromises.push(manager.save(newSongArtist));
          });
        }

        if (genreIds) {
          genreIds.forEach((genreId) => {
            const newSongGenre = this.songGenreRepository.create({
              song: newSong.id,
              genreInfo: genreId,
            });
            savePromises.push(manager.save(newSongGenre));
          });
        }

        await Promise.all(savePromises);
      });
      const result =
        await this.songManagementUtilService.retrieveSongDataBys3name(s3name);
      return result;
    } catch (error) {
      exceptionHandler(error);
    }
  }
  async cancelUploadSong(songId: number, _userId: number) {
    try {
      if (!songId) throw new BadRequestException('songId is required');
      const song = await this.songRepository.findOne({
        relations: ['item'],
        where: {
          id: songId,
        },
      });
      // const item = song.item as Item;
      // const ownItem = await this.findPinballheadItem(item.id, userId);
      // if (!ownItem) throw new NotFoundException('pinballhead does not exist');
      await this.dataSource.transaction(async (manager) => {
        await manager.update(Song, songId, {
          status: SongStatus.NOT_UPLOAD,
        });
      });
    } catch (error) {
      exceptionHandler(error);
    }
  }

  // TODO: update required
  async updateUploadSong(
    updateSongDto: UpdateSongDto,
    songId: number,
    _userId: number
  ) {
    try {
      const { name, description } = updateSongDto;
      if (!songId) throw new BadRequestException('songId is required');
      const song = await this.songRepository.findOne({
        relations: ['item'],
        where: {
          id: songId,
        },
      });
      // const item = song.item as Item;
      // const ownItem = await this.findPinballheadItem(item.id, userId);
      // if (!ownItem) throw new NotFoundException('pinballhead does not exist');
      await this.dataSource.transaction(async (manager) => {
        await manager.update(Song, songId, {
          name,
          description,
        });
      });
      const updatesong =
        await this.songManagementUtilService.retrieveSongDataById(songId);
      return updatesong;
    } catch (error) {
      exceptionHandler(error);
    }
  }
}
