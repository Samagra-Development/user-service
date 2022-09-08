import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  getHello(): string {
    const dbUser  = this.configService.get<{host: string, enc: {enabled: boolean, key1: string}}>('port');
    return `Hello World! ${typeof dbUser}`;
  }
}
