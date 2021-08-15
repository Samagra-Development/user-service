import { Test, TestingModule } from '@nestjs/testing';

import { FusionauthService } from './fusionauth/fusionauth.service';
import { UserDBService } from './user-db/user-db.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let fusionauthService: FusionauthService;
  let userDBService: UserDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FusionauthService, UserDBService, UserService],
    }).compile();
    fusionauthService = module.get<FusionauthService>(FusionauthService);
    userDBService = module.get<UserDBService>(UserDBService);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(fusionauthService).toBeDefined();
    expect(userDBService).toBeDefined();
    expect(service).toBeDefined();
  });
});
