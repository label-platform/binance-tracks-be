import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EarningService } from './earning.service';
@Processor('earning')
export class EarningProcessor {
  constructor(
    private earningService: EarningService
  ) { }

  @Process('calculate')
  async handleCalculate(job: Job) {
    await this.earningService.processCalculation(job.data.data);
    return true;
  }

}
