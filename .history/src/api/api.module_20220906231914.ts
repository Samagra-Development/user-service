import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { QueryGeneratorService } from './fusionauth/query-generator/query-generator.service';
import { OtpService } from './otp/otp.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ApiController],
  providers: [ApiService, FusionauthService, OtpService, QueryGeneratorService, ConfigResolverService]
})
export class ApiModule {}
