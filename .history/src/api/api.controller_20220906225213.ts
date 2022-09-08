import {
  Body,
  Controller,
  Request,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  SignupResponse,
  UserRegistration,
  UsersResponse,
} from './api.interface';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { SMSResponse } from './sms/sms.interface';

@Controller('api')
export class ApiController {
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly apiService: ApiService,
    private readonly configResolverService: ConfigResolverService,
  ) {}

  @Get()
  getHello(): string {
    return this.configResolverService.getHost("port");
  }
 
}
