import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleTaskModule } from '@schedule-tasks/schedule-task.module';
import { DatabaseModule } from '@libs/l2e-database';
import { ConfigModule } from '@nestjs/config';
import { HealthzModule } from './healthz/healthz.module';

@Module({
  imports: [
    ScheduleTaskModule,
    DatabaseModule,
    ConfigModule.forRoot(),
    HealthzModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
