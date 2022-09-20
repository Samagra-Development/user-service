import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ChangePasswordDTO } from './dto/changePassword.dto';

import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { SMSResponse } from './sms/sms.interface';
import { SignupResponse } from './user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly otpService: OtpService,
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
    return await this.userService.signup(user);
  }

  @Post('/login')
  async login(@Body() user: any): Promise<SignupResponse> {
    if (
      process.env.ENCRYPTION_ENABLED === 'TRUE' &&
      user.applicationId === process.env.FUSIONAUTH_APPLICATION_ID
    ) {
      user.loginId = this.userService.encrypt(user.loginId);
      user.password = this.userService.encrypt(user.password);
    }
    return await this.userService.login(user);
  }

  @Patch('/update')
  async update(@Body() user: any): Promise<SignupResponse> {
    return await this.userService.update(user);
  }

  @Post('/changePassword/sendOTP')
  async changePasswordOTP(@Body() data: any): Promise<SignupResponse> {
    return await this.userService.changePasswordOTP(data.username);
  }

  @Patch('/changePassword/update')
  async changePassword(
    @Body() data: ChangePasswordDTO,
  ): Promise<SignupResponse> {
    return await this.userService.changePassword(data);
  }
}
