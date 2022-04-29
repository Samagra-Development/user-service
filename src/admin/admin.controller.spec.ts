import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FusionauthService } from './fusionauth/fusionauth.service';

describe('AdminController', () => {
  let controller: AdminController;
  let fusionauthService: FusionauthService;
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      imports: [AuthModule, HttpModule],
      providers: [
        FusionauthService,
        AdminService
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    fusionauthService = module.get<FusionauthService>(FusionauthService);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(fusionauthService).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
