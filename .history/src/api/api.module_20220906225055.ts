import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';

@Module({
  controllers: [ApiController],
  providers: [ApiService, ConfigResolverService]
})
export class ApiModule {}
