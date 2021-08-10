import { SMSData, SMSType } from '../sms/sms.interface';

import { Injectable } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class OtpService {
  expiry: number = parseInt(process.env.OTP_EXPIRY);

  constructor(private readonly smsService: SmsService) {}

  verifyOTP(): boolean | PromiseLike<boolean> {
    return Promise.resolve(true);
  }

  sendOTP(): boolean | PromiseLike<boolean> {
    const smsData: SMSData = {
      phone: '919415787824',
      template: null,
      type: SMSType.otp,
      params: {
        otp: OtpService.generateOtp(),
        expiry: this.expiry,
      },
    };
    return this.smsService.send(smsData);
  }

  static generateOtp() {
    return Math.floor(1000 + Math.random() * 9000);
  }
}
