import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  getHello(): string {
    const dbUser:{host: string, enc: {enabled: boolean, key1: string}}  = this.configService.get<any>('port');
    return `Hello World! ${typeof dbUser}`;
  }
}
