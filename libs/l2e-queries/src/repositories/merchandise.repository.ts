import { Repository } from 'typeorm';
import { Merchandise } from '../entities/merchandise.entity';

export class MerchandiseRepository extends Repository<Merchandise> {}
