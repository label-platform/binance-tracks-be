import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';

export class ItemRepository extends Repository<Item> {}
