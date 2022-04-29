import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { FusionauthService } from './fusionauth/fusionauth.service';
import got from 'got/dist/source';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [
    AdminService,
    FusionauthService,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
