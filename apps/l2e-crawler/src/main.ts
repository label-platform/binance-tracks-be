/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@src/modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'crawler';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.CRAWLER_PORT || 4444;
  await app.listen(port);
  Logger.log(process.env.NODE_ENV);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
