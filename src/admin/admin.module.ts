import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { FusionauthService } from './fusionauth/fusionauth.service';
import got from 'got/dist/source';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { QueryGeneratorService } from './query-generator/query-generator.service';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [
    AdminService,
    FusionauthService,
    QueryGeneratorService,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
