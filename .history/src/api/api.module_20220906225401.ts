import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';

@Module({
  imports: [ConfigModule],
  controllers: [ApiController],
  providers: [ApiService, ConfigResolverService]
})
export class ApiModule {}
