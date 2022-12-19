import { Repository } from 'typeorm';
import { Song } from '../../entities/songs';

export class SongRepository extends Repository<Song> {}
