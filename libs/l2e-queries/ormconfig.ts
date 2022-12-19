import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const config = dotenv.config({
  path: path.resolve(
    process.env.NODE_ENV === 'prod'
      ? `../../../../.env`
      : process.env.NODE_ENV === 'stage'
      ? `../../../../.env.stage`
      : process.env.NODE_ENV === 'test'
      ? `../../../../.env.test`
      : `../../../../.env`
  ),
});

const { DB_HOST, DB_PORT, DB_NAME, DB_PASS, DB_USER } = config.parsed;

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  type: 'mysql',
  host: DB_HOST,
  port: parseInt(<string>DB_PORT),
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  entities: [__dirname + '/src/entities/**/*.entity.{ts,js}'],

  /* Note : it is unsafe to use synchronize: true for schema synchronization
    on production once you get data in your database. */
  // synchronize: true,
  timezone: '+00:00',
  autoLoadEntities: true,
};

console.log(typeOrmModuleOptions);

const OrmConfig = {
  ...typeOrmModuleOptions,
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/src/migrations/*.ts'],
  cli: {
    migrationsDir: __dirname + '/src/migrations',
  },
};

export const ormConfigDataSource = new DataSource(OrmConfig as any);
