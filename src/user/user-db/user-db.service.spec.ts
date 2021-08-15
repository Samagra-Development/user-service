import { Test, TestingModule } from '@nestjs/testing';

import { UserDBService } from './user-db.service';

describe('UserDbService', () => {
  let service: UserDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDBService],
    }).compile();

    service = module.get<UserDBService>(UserDBService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
