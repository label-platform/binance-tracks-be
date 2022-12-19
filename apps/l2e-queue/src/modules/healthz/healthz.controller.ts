import { Controller, Get } from '@nestjs/common';
import { HealthzService } from './healthz.service';

@Controller('healthz')
export class HealthzController {
  constructor(private readonly healthzService: HealthzService) {}

  @Get()
  checkHealthz() {
    return this.healthzService.checkHealthz();
  }
}
