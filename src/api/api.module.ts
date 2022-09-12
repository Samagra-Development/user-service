import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { QueryGeneratorService } from './fusionauth/query-generator/query-generator.service';
import { OtpService } from './otp/otp.service';
import { GupshupService } from './sms/gupshup/gupshup.service';
import { SmsService } from './sms/sms.service';
import got from 'got/dist/source';

const gupshupFactory = {
  provide: 'OtpService',
  useFactory: (username, password, baseUrl) => {
    return new GupshupService(
      username,
      password,
      baseUrl,
      got,
    );
  },
  inject: [],
};

const otpServiceFactory = {
  provide: OtpService,
  useFactory: (config: ConfigService) => {
    return new OtpService(gupshupFactory.useFactory(config.get('GUPSHUP_USERNAME'), config.get('GUPSHUP_PASSWORD'), config.get('GUPSHUP_BASEURL'),));
  },
  inject: [ConfigService],
};

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ApiController],
  providers: [ApiService, FusionauthService, SmsService, otpServiceFactory, QueryGeneratorService, ConfigResolverService]
})
export class ApiModule {}
