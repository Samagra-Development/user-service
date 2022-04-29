import { Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SignupResponse } from './dst.interface';
import { DstService } from './dst.service';
import { OtpService } from './otp/otp.service';
import { SMSResponse, SMSResponseStatus } from './sms/sms.interface';

@Controller('dst')
export class DstController {
    constructor(
        private readonly otpService: OtpService,
        private readonly dstService: DstService,
      ) {}

      @Get('/sendOTP')
      @UseGuards(AuthGuard('basic'))
      async sendOTP(@Query('phone') phone): Promise<any> {
        const status: SMSResponse = await this.otpService.sendOTP(phone);
        const resp: SignupResponse = await this.dstService.transformOtpResponse(status);
        return { resp };
      }
    
      @Get('/verifyOTP')
      @UseGuards(AuthGuard('basic'))
      async verifyOTP(@Query('phone') phone, @Query('otp') otp): Promise<any> {
        const otpStatus: SMSResponse = await this.otpService.verifyOTP({ phone, otp });
        const status = otpStatus.status;
        const resp: SignupResponse = await this.dstService.verifyAndLoginOTP({ phone, status });
        return { resp };
      }
}
