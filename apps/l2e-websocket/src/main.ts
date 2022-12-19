/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {Logger, ValidationPipe} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './modules/app.module';
import { RedisIoAdapter } from './utils/redis.io-adapter';
import {WinstonModule} from "nest-winston";
import * as Winston from "winston";
import {utilities as nestWinstonModuleUtilities} from "nest-winston/dist/winston.utilities";
import {VALIDATION_PIPE_OPTIONS} from "./common/common.constants";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new Winston.transports.Console({
          format: Winston.format.combine(
            Winston.format.colorize(),
            Winston.format.timestamp(),
            Winston.format.align(),
            nestWinstonModuleUtilities.format.nestLike('WEBSOCKET', {
              prettyPrint: true,
            })
          ),
        }),
      ],
    })
  });
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));

  /*app.enableCors({
    origin: ['http://localhost:3000', 'http://clesson-dev.duckdns.org:3001'],
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });*/

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.WEBSOCKET_PORT || 5555;
  await app.listen(port);
  Logger.log(
    `🚀 WebSocket Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
