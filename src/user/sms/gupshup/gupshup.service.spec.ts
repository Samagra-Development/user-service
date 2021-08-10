import { Test, TestingModule } from '@nestjs/testing';

import { GupshupService } from './gupshup.service';

describe('GupshupService', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GupshupService],
    }).compile();

    service = module.get<GupshupService>(GupshupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
