import { Repository } from 'typeorm';
import { Playlist } from '../entities';

export class PlaylistRepository extends Repository<Playlist> {}
