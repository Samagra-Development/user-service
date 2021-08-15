import { FusionauthService } from './fusionauth/fusionauth.service';
import { GupshupService } from './sms/gupshup/gupshup.service';
import { Module } from '@nestjs/common';
import { OtpService } from './otp/otp.service';
import { SmsService } from './sms/sms.service';
import { UserController } from './user.controller';
import { UserDBService } from 'src/user/user-db/user-db.service';
import { UserService } from './user.service';

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
  providers: [
    UserDBService,
    FusionauthService,
    otpServiceFactory,
    SmsService,
    UserService,
  ],
  controllers: [UserController],
})
export class UserModule {}
