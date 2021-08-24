import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';

import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { SMS, SMSResponse, TrackStatus } from './sms/sms.interface';
import { SmsService } from './sms/sms.service';
import { SignupResponse } from './user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {}

  @Get('/verify')
  async verifyUsernamePhoneCombination(): Promise<any> {
    const status: boolean =
      await this.fusionAuthService.verifyUsernamePhoneCombination();
    return { status };
  }

  @Get('/sendOTP')
  async sendOTP(@Query('phone') phone): Promise<any> {
    const status: SMSResponse = await this.otpService.sendOTP(phone);
    return { status };
  }

  @Get('/verifyOTP')
  async verifyOTP(@Query('phone') phone, @Query('otp') otp): Promise<any> {
    const status: SMSResponse = await this.otpService.verifyOTP({ phone, otp });
    return { status };
  }

  @Post('/signup')
  async signup(@Body() user: any): Promise<SignupResponse> {
    const status: SignupResponse = await this.userService.signup(user);
    return status;
  }

  @Post('/login')
  async login(@Body() user: any): Promise<SignupResponse> {
    const status: SignupResponse = await this.userService.login(user);
    return status;
  }

  @Patch('/update')
  async update(@Body() user: any): Promise<SignupResponse> {
    const status: SignupResponse = await this.userService.update(user);
    return status;
  }
}
