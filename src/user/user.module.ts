import { FusionauthService } from './fusionauth/fusionauth.service';
import { GupshupService } from './sms/gupshup/gupshup.service';
import { Module } from '@nestjs/common';
import { OtpService } from './otp/otp.service';
import { SmsService } from './sms/sms.service';
import { UserController } from './user.controller';

const gupshupFactory = {
  provide: 'OtpService',
  useFactory: () => {
    return new GupshupService(
      process.env.GUPSHUP_USERNAME,
      process.env.GUPSHUP_PASSWORD,
      process.env.GUPSHUP_BASEURL,
    );
  },
  inject: [],
};

const otpServiceFactory = {
  provide: OtpService,
  useFactory: () => {
    return new OtpService(gupshupFactory.useFactory());
  },
  inject: [],
};

@Module({
  providers: [FusionauthService, otpServiceFactory, SmsService],
  controllers: [UserController],
})
export class UserModule {}
