/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from '@cores/exception-filters/http-exception.filter';
import { AppModule } from '@src/modules/app.module';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as Winston from 'winston';
// import cookieParser from 'cookie-parser';
import * as fs from 'fs';

async function bootstrap() {
  // const httpsOptions =
  //   process.env.ENV === 'staging'
  //     ? {
  //         key: fs.readFileSync('./private.pem'),
  //         cert: fs.readFileSync('./cert.pem'),
  //       }
  //     : undefined;

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new Winston.transports.Console({
          format: Winston.format.combine(
            Winston.format.colorize(),
            Winston.format.timestamp(),
            Winston.format.align(),
            nestWinstonModuleUtilities.format.nestLike('TRACKS', {
              prettyPrint: true,
            })
          ),
        }),
      ],
    }),
    httpsOptions: {
      key: fs.readFileSync('./private.pem'),
      cert: fs.readFileSync('./cert.pem'),
    },
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('L2E API Example')
    .setDescription('L2E API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // app.use(cookieParser());

  app.enableCors({
    origin: [
      'https://fe.tracks.label.community',
      'http://localhost:3000',
      'http://clesson-dev.duckdns.org:3001',
      'http://10.0.2.2:3000',
    ],
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const port = process.env.BACKEND_PORT || 3333;

  await app.listen(port);
  Logger.log(`Your environment now is ${process.env.NODE_ENV}`);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
