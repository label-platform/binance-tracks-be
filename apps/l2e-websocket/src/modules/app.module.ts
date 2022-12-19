import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './play-system/websocket.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { REDIS_URL } from '@src/common/common.constants';
import { DatabaseModule } from '@libs/l2e-database';
import { BullModule } from '@nestjs/bull';
import { HealthzModule } from './healthz/healthz.module';

@Module({
  imports: [
    DatabaseModule,
    WebsocketModule,
    RedisModule.forRootAsync({
      useFactory: () => ({
        config: {
          url: REDIS_URL,
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    HealthzModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
