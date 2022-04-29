import { User } from '@fusionauth/typescript-client';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ResponseCode, ResponseStatus, SignupResponse } from './dst.interface';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom, map } from 'rxjs';
import { SMSData, SMSResponseStatus, SMSType } from './sms/sms.interface';
import { SmsService } from 'src/user/sms/sms.service';
import { UsersResponse } from 'src/user/user.interface';

@Injectable()
export class DstService {
  expiry: number = parseInt(process.env.OTP_EXPIRY);
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly httpService: HttpService,
  ) {}

  async createUser(data: any): Promise<any> {
    const url = process.env.FUSIONAUTH_OLD_BASE_URL + '/api/user/registration';
    return firstValueFrom(
      this.httpService
        .post(url, data, {
          headers: {
            Authorization: process.env.FUSIONAUTH_OLD_API_KEY,
            'Content-Type': 'application/json',
          },
        })
        .pipe(map((response) => response.data)),
    );
  }

  async updatePassword(data: any): Promise<any> {
    return firstValueFrom(
      this.httpService
        .post(
          process.env.FUSIONAUTH_OLD_BASE_URL + '/api/user/change-password',
          {
            loginId: data.loginId,
            password: data.password,
          },
          {
            headers: {
              Authorization: process.env.FUSIONAUTH_OLD_API_KEY,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(map((response) => (response.status === 200 ? true : false))),
    );
  }

  async login(user: any): Promise<SignupResponse> {
    let fusionAuthUser = (await this.fusionAuthService.login(user)).response;
    // if (fusionAuthUser.user === undefined) {
    //     console.log("Here")
    //     fusionAuthUser = fusionAuthUser.loginResponse.successResponse;
    // }
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.responseCode = ResponseCode.OK;
    response.result = {
      responseMsg: 'Successful Logged In',
      accountStatus: null,
      data: {
        user: fusionAuthUser,
        schoolResponse: null,
      },
    };
    return response;
  }

  async verifyAndLoginOTP({ phone, status }): Promise<SignupResponse> {
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    let password = uuidv4();
    if (status === SMSResponseStatus.success) {
      const data = {
        registration: {
          applicationId: process.env.FUSIONAUTH_DST_APPLICATION_ID,
          preferredLanguages: ['en'],
          roles: [],
          timezone: 'Asia/Kolkata',
          username: phone,
          usernameStatus: 'ACTIVE',
        },
        user: {
          preferredLanguages: ['en'],
          timezone: 'Asia/Kolkata',
          usernameStatus: 'ACTIVE',
          username: phone,
          password: password,
        },
      };
      const user = await this.createUser(data).catch((e) => {
        console.log(e.response.data);
        return e.response.data.fieldErrors['user.username']['code'];
      });
      if (typeof user === "string") {
          console.log("HERE");
          console.log(response.params.err);
          
        if (user === '[duplicate]user.username') {
          password = uuidv4();
          const passwordStatus = await this.updatePassword({
            loginId: phone,
            password: password,
          }).catch((e) => {
            console.log(e.response.data);
            return false;
          });
          if (passwordStatus) {
            return this.login({
              loginId: phone,
              password: password,
              applicationId: process.env.FUSIONAUTH_DST_APPLICATION_ID,
            });
          } else {
            response.params.err = 'INVALID_LOGIN';
            response.params.errMsg =
              'Error Logging In. Please try again later.';
            response.params.status = ResponseStatus.failure;
          }
            } else {
          response.params.err = 'INVALID_REGISTRATION';
          response.params.errMsg = 'Error Logging In. Please try again later.';
          response.params.status = ResponseStatus.failure;
        }
      } else {
        password = uuidv4();
        const passwordStatus = await this.updatePassword({
          loginId: phone,
          password: password,
        }).catch((e) => {
          console.log(e.response.data);
          response.params.err = 'ERROR_PASSWORD_RESET';
          response.params.errMsg = 'Error Logging In. Please try again later.';
          response.params.status = ResponseStatus.failure;
        });
        if (passwordStatus) {
          return this.login({
            loginId: phone,
            password: password,
            applicationId: process.env.FUSIONAUTH_DST_APPLICATION_ID,
          });
        } else {
          response.params.err = 'INVALID_LOGIN';
          response.params.errMsg = 'Error Logging In. Please try again later.';
          response.params.status = ResponseStatus.failure;
        }
      }
    } else {
      response.params.err = 'INVALID_OTP_ERROR';
      response.params.errMsg = 'OTP incorrect';
      response.params.status = ResponseStatus.failure;
    }
    return response;
  }
}
