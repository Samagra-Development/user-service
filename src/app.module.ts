import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CdacService } from './user/sms/cdac/cdac.service';
import { ConfigModule } from '@nestjs/config';
import { FusionauthService } from './user/fusionauth/fusionauth.service';
import { GupshupService } from './user/sms/gupshup/gupshup.service';
import { Module } from '@nestjs/common';
import { OtpService } from './user/otp/otp.service';
import { UserDBService } from './user/user-db/user-db.service';
import { UserModule } from './user/user.module';

const gupshupFactory = {
  provide: 'GupshupService',
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
  provide: 'OtpService',
  useFactory: () => {
    return new OtpService(gupshupFactory.useFactory());
  },
  inject: [],
};

@Module({
  imports: [ConfigModule.forRoot(), UserModule],
  controllers: [AppController],
  providers: [
    AppService,
    FusionauthService,
    gupshupFactory,
    otpServiceFactory,
    {
      provide: 'SmsService',
      useClass: CdacService,
    },
    UserDBService,
  ],
})
export class AppModule {}
