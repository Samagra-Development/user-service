import { User } from '@fusionauth/typescript-client';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  All,
  Req,
} from '@nestjs/common';
import {
  SignupResponse,
  UserRegistration,
  UsersResponse,
  ResponseCode,
  ResponseStatus
} from './api.interface';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { SMSResponse } from './sms/sms.interface';
import { RefreshRequest } from '@fusionauth/typescript-client/build/src/FusionAuthClient';
import { ChangePasswordDTO } from './dto/changePassword.dto';
import { SentryInterceptor } from '../interceptors/sentry.interceptor';
import * as Sentry from '@sentry/node';
import { LoginDto, LoginWithUniqueIdDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Throttle, SkipThrottle} from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { VerifyJWTDto } from './dto/verify-jwt.dto';
import { Request } from 'express';
import { GupshupWhatsappService } from './sms/gupshupWhatsapp/gupshupWhatsapp.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CryptoJS = require('crypto-js');

CryptoJS.lib.WordArray.words;

@Controller('api')
@UseInterceptors(SentryInterceptor)
export class ApiController {
  constructor(
    private configService: ConfigService,
    private readonly fusionAuthService: FusionauthService,
    private readonly otpService: OtpService,
    private readonly apiService: ApiService,
    private readonly configResolverService: ConfigResolverService,
    private readonly gupshupWhatsappService: GupshupWhatsappService
  ) {}

  @Get()
  getHello(): any {
    return {
      respCode: '200',
      respMessage: 'Hello!',
    };
  }

  @SkipThrottle()
  @Get('sendOTP')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendOTP(
    @Query() params: SendOtpDto,
    @Headers('x-application-id') applicationId?,
  ): Promise<any> {
    if (applicationId) {
      const { total }: { total: number; users: Array<User> } =
        await this.fusionAuthService.getUsersByString(
          `(username: ${params.phone}, mobilePhone: ${params.phone})`,
          0,
          1,
          applicationId,
          null,
        );
      if (!total || total == 0) {
        Sentry.captureMessage('Phone number not registered', {
          user: {
            username: params.phone,
            applicationId: applicationId,
          },
        });
        throw new UnprocessableEntityException(
          params.errorMessage ?? 'User not found.',
        );
      }
    }
     // Check if phone number contains country code (e.g. 91-1234567890)
     if (params.phone.includes('-')) {
      const [countryCode, number] = params.phone.split('-');
      params.phone = number;
      const status: any = await this.gupshupWhatsappService.sendWhatsappOTP({
        phone: number,
        template: null,
        type: null,
        params: null
      });
      return { status };
    } else {
      const status: any = await this.otpService.sendOTP(params.phone);
      return { status };
    }
  }

  @Get('verifyOTP')
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyOTP(@Query() params: VerifyOtpDto): Promise<any> {
    const status: SMSResponse = await this.otpService.verifyOTP(params);
    return { status };
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(
    @Body() user: LoginDto,
    @Headers('authorization') authHeader,
  ): Promise<any> {
    const encStatus = this.configResolverService.getEncryptionStatus(
      user.applicationId,
    );
    if (encStatus) {
      const encodedBase64Key = this.configResolverService.getEncryptionKey(
        user.applicationId,
      );
      const parsedBase64Key =
        encodedBase64Key === undefined
          ? CryptoJS.enc.Base64.parse('bla')
          : CryptoJS.enc.Base64.parse(encodedBase64Key);

      let loginId = '';
      try {
        loginId = this.apiService.decrypt(user.loginId, parsedBase64Key);
      } catch (e) {
        console.log(`Problem in decrypting loginId: ${user.loginId}`);
      }

      let password = '';
      try {
        password = this.apiService.decrypt(user.password, parsedBase64Key);
      } catch (e) {
        console.log(`Problem in decrypting password: ${user.password}`);
      }

      // if we are not able to decrypt, we'll try to authenticate with the original creds
      user.loginId = loginId ? loginId : user.loginId;
      user.password = password ? password : user.password;
    }
    return await this.apiService.login(user, authHeader);
  }

  @Post('login/pin')
  async loginByPin(
    @Body() user: any,
    @Headers('authorization') authHeader,
  ): Promise<any> {
    const encStatus = this.configResolverService.getEncryptionStatus(
      user.applicationId,
    );
    const encodedBase64Key = this.configResolverService.getEncryptionKey(
      user.applicationId,
    );
    const parsedBase64Key =
      encodedBase64Key === undefined
        ? CryptoJS.enc.Base64.parse('bla')
        : CryptoJS.enc.Base64.parse(encodedBase64Key);
    if (encStatus) {
      user.loginId = this.apiService.decrypt(user.loginId, parsedBase64Key);
      // user.password = this.apiService.decrypt(user.password, parsedBase64Key);
    } else {
      user.password = this.apiService.encrypt(user.password, parsedBase64Key);
    }

    return await this.apiService.login(user, authHeader);
  }

  //
  @Get('all')
  async fetchUsers(
    @Query()
    data: {
      startRow: number;
      numberOfResults: number;
    },
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<UsersResponse> {
    return await this.apiService.fetchUsers(
      applicationId,
      data.startRow,
      data.numberOfResults,
      authHeader,
    );
  }

  @Post('changePassword')
  async updatePassword(
    @Body() data: { loginId: string; password: string },
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<SignupResponse> {
    return await this.apiService.updatePassword(
      data,
      applicationId,
      authHeader,
    );
  }

  @Post('changePin')
  async updatePin(
    @Body() data: { loginId: string; password: string },
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<SignupResponse> {
    const encodedBase64Key =
      this.configResolverService.getEncryptionKey(applicationId);
    const parsedBase64Key =
      encodedBase64Key === undefined
        ? CryptoJS.enc.Base64.parse('bla')
        : CryptoJS.enc.Base64.parse(encodedBase64Key);
    data.password = this.apiService.encrypt(data.password, parsedBase64Key);
    return await this.apiService.updatePassword(
      data,
      applicationId,
      authHeader,
    );
  }

  @Post('signup')
  async createUser(
    @Body() data: UserRegistration,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<SignupResponse> {
    return await this.apiService.createUser(data, applicationId, authHeader);
  }

  @Post('signupByPin')
  async createUserByPin(
    @Body() data: UserRegistration,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<SignupResponse> {
    return await this.apiService.createUserByPin(
      data,
      applicationId,
      authHeader,
    );
  }

  @Patch('updateUser/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() data: User,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<SignupResponse> {
    return await this.apiService.updateUser(
      userId,
      data,
      applicationId,
      authHeader,
    );
  }

  @Get('searchUserByQuery')
  async searchUser(
    @Query()
    query: {
      queryString: string;
      startRow: number;
      numberOfResults: number;
    },
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<UsersResponse> {
    return await this.apiService.fetchUsersByString(
      query.queryString,
      query.startRow,
      query.numberOfResults,
      applicationId,
      authHeader,
    );
  }

  // @Get('user/:userId')
  // async searchUserbyId(
  //   @Param('userId') userId: string,
  //   @Headers('authorization') authHeader,
  //   @Headers('x-application-id') applicationId,
  // ): Promise<UsersResponse> {
  //   const queryString = `(id: ${userId})`; // pass the strict user ID filter
  //   return await this.apiService.fetchUsersByString(
  //     queryString,
  //     undefined,
  //     undefined,
  //     applicationId,
  //     authHeader,
  //   );
  // }

  @Post('refresh-token')
  async refreshToken(
    @Body() refreshRequest: RefreshRequest,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
  ): Promise<UsersResponse> {
    return this.apiService.refreshToken(
      applicationId,
      refreshRequest,
      authHeader,
    );
  }

  // @Patch('/user/:userId/deactivate')
  // async deactivateUserById(
  //   @Param('userId') userId: string,
  //   @Query('hardDelete') hardDelete = false,
  //   @Headers('authorization') authHeader,
  //   @Headers('x-application-id') applicationId,
  // ): Promise<UsersResponse> {
  //   return await this.apiService.deactivateUserById(
  //     userId,
  //     hardDelete,
  //     applicationId,
  //     authHeader,
  //   );
  // }

  // @Patch('/user/:userId/activate')
  // async activateUserById(
  //   @Param('userId') userId: string,
  //   @Headers('authorization') authHeader,
  //   @Headers('x-application-id') applicationId,
  // ): Promise<UsersResponse> {
  //   return await this.apiService.activateUserById(
  //     userId,
  //     applicationId,
  //     authHeader,
  //   );
  // }

  @Post('/changePassword/sendOTP')
  async changePasswordOTP(
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
    @Body() data: any,
  ): Promise<SignupResponse> {
    return await this.apiService.changePasswordOTP(
      data.username,
      applicationId,
      authHeader,
    );
  }

  @Patch('/changePassword/update')
  @UsePipes(new ValidationPipe({ transform: true }))
  async changePassword(
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
    @Body() data: ChangePasswordDTO,
  ): Promise<SignupResponse> {
    return await this.apiService.changePassword(
      data,
      applicationId,
      authHeader,
    );
  }

  @Post('login/otp')
  @UsePipes(new ValidationPipe({ transform: true }))
  async loginWithOtp(
    @Body() user: LoginDto,
    @Headers('authorization') authHeader,
  ): Promise<any> {
    return await this.apiService.loginWithOtp(user, authHeader);
  }

  @Post('login-with-unique-id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async loginWithUniqueId(
    @Body() user: LoginWithUniqueIdDto,
    @Headers('authorization') authHeader,
    @Headers('ADMIN-API-KEY') adminApiKey
  ): Promise<any> {
    if(adminApiKey!=this.configService.get('ADMIN_API_KEY')){
      const response: SignupResponse = new SignupResponse().init(uuidv4());
      response.responseCode = ResponseCode.FAILURE;
      response.params.err = 'UNAUTHORIZED';
      response.params.errMsg = 'Invalid admin api key';
      response.params.status = ResponseStatus.failure;
      return response;
    }
    return await this.apiService.loginWithUniqueId(user, authHeader);
  }
  
  @Post('jwt/verify')
  @UsePipes(new ValidationPipe({transform: true}))
  async jwtVerify(
    @Body() body: VerifyJWTDto
  ): Promise<any> {
    return await this.apiService.verifyJWT(body.token);
  }

  @Post('logout')
  @UsePipes(new ValidationPipe({transform: true}))
  async logout(
    @Body() body: VerifyJWTDto
  ): Promise<any> {
    return await this.apiService.logout(body.token);
  }

  @All('*')
  async defaultRoute(
    @Req() request: Request,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId,
    @Body() body: any,
    @Query() query: any,
    @Param() params: any,
  ): Promise<any> {
    const fusionAuthBaseUrl = this.configService.get('FUSIONAUTH_BASE_URL');
    const url = new URL(`${fusionAuthBaseUrl}${request.url}`);
    
    // Add query params to URL
    if (query) {
      Object.keys(query).forEach(key => {
        url.searchParams.append(key, query[key]);
      });
    }

    // Add params to URL
    if (params) {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    }

    const response = await fetch(url, {
      method: request.method,
      body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      headers: {
        'Authorization': authHeader,
        'x-application-id': applicationId,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }
}
