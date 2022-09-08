import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  getHello(): string {
    const dbUser:{host: string, enc: {enabled: boolean, key: string}}  = this.configService.get<{host: string, enc: {enabled: boolean, key: string}}>('port');
    return `Hello World! ${typeof dbUser}`;
  }
}
