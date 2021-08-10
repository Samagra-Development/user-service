import { Test, TestingModule } from '@nestjs/testing';

import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { SmsService } from './sms/sms.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let fusionauthService: FusionauthService;
  let otpService: OtpService;
  let smsService: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [FusionauthService, OtpService, SmsService],
    }).compile();

    controller = module.get<UserController>(UserController);
    fusionauthService = module.get<FusionauthService>(FusionauthService);
    otpService = module.get<OtpService>(OtpService);
    smsService = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(fusionauthService).toBeDefined();
    expect(otpService).toBeDefined();
    expect(smsService).toBeDefined();
  });

  it('should verify username phone number combinations', async () => {
    const result = false;
    jest
      .spyOn(fusionauthService, 'verifyUsernamePhoneCombination')
      .mockImplementation(() => Promise.resolve(result));

    expect(await controller.verifyUsernamePhoneCombination()).toStrictEqual({
      status: result,
    });
  });
});
