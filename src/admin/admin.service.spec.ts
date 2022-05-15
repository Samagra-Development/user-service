import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../auth/auth.module';
import { AdminService } from './admin.service';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { QueryGeneratorService } from './query-generator/query-generator.service';

describe('AdminService', () => {
  let service: AdminService;
  let fusionauthService: FusionauthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, AuthModule],
      providers: [
        FusionauthService,
        AdminService,
        QueryGeneratorService,
      ],
    }).compile();
    fusionauthService = module.get<FusionauthService>(FusionauthService);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(fusionauthService).toBeDefined();
    expect(service).toBeDefined();
  });
});
