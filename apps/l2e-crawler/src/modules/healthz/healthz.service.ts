import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthzService {
  async checkHealthz() {
    // TODO- 상태체크 로직 추가 필요
    // return HttpException('Failed to Check Health', 500);

    return { data: { status: 'OK' } };
  }
}
