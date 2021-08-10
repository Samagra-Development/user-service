import { Controller, Get } from '@nestjs/common';

import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { SmsService } from './sms/sms.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
  ) {}

  @Get('/verify')
  async verifyUsernamePhoneCombination(): Promise<any> {
    const status: boolean =
      await this.fusionAuthService.verifyUsernamePhoneCombination();
    return { status };
  }

  @Get('/sendOTP')
  async sendOTP(): Promise<any> {
    const status: boolean = await this.otpService.sendOTP();
    return { status };
  }

  @Get('/verifyOTP')
  async verifyOTP(): Promise<any> {
    const status: boolean = await this.otpService.verifyOTP();
    return { status };
  }
}
