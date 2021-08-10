import { Test, TestingModule } from '@nestjs/testing';

import { GupshupService } from './gupshup.service';

const gupshupFactory = {
  provide: GupshupService,
  useFactory: () => {
    return new GupshupService(
      process.env.GUPSHUP_USERNAME,
      process.env.GUPSHUP_PASSWORD,
      process.env.GUPSHUP_BASEURL,
    );
  },
  inject: [],
};

describe('GupshupService', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [gupshupFactory],
    }).compile();

    service = module.get<GupshupService>(GupshupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
