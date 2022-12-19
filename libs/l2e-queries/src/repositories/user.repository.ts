import { Repository } from 'typeorm';
import { User } from '../entities';

export interface UserRepository extends Repository<User> {
  this: Repository<User>;

  findUserIncludePasswordByEmail(email: string): Promise<User>;
}

export const customUserRepositoryMethods: Pick<
  UserRepository,
  'findUserIncludePasswordByEmail'
> = {
  async findUserIncludePasswordByEmail(email: string): Promise<User> {
    return await this.createQueryBuilder('users')
      .select([
        'users.id',
        'users.email',
        'users.password',
        'users.activationCodeId',
      ])
      .where(`users.email = :email`, { email })
      .getOne();
  },
};
