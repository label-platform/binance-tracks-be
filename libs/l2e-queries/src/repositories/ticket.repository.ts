import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';

export class TicketRepository extends Repository<Ticket> {}
