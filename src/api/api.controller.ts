import { User } from '@fusionauth/typescript-client';
import {
  Body,
  Controller,
  Request,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Headers,
} from '@nestjs/common';
import {
    ApiConfig,
  SignupResponse,
  UserRegistration,
  UsersResponse,
} from './api.interface';
import { ApiService } from './api.service';
import { ConfigResolverService } from './config.resolver.service';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { SMSResponse } from './sms/sms.interface';
import { RefreshRequest } from '@fusionauth/typescript-client/build/src/FusionAuthClient';
const CryptoJS = require('crypto-js');
const AES = require('crypto-js/aes');

CryptoJS.lib.WordArray.words;

@Controller('api')
export class ApiController {
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly otpService: OtpService,
    private readonly apiService: ApiService,
    private readonly configResolverService: ConfigResolverService,
  ) {}

  @Get()
  getHello(): any {
      let respVar: {respCode: string, respMessage: string}= {respCode: "200", respMessage: "Hello!"};
      const config: ApiConfig = this.configResolverService.getConfigByApplicationId("port");
      const host = this.configResolverService.getHost("port");
      const apiKey = this.configResolverService.getApiKey("port");
      const encStatus = this.configResolverService.getEncryptionStatus("port");
      const encKey = this.configResolverService.getEncryptionKey("port");
      respVar['authHeader']="Dummy"
      respVar['authHeader1'] =  "authHeader1"
    return {host: host, key: apiKey, encStatus: encStatus, encKey: encKey, respVar: respVar['authHeader']};
  }

  @Get('sendOTP')
  async sendOTP(@Query('phone') phone): Promise<any> {
    const status: SMSResponse = await this.otpService.sendOTP(phone);
    return { status };
  }

  @Get('verifyOTP')
  async verifyOTP(@Query('phone') phone, @Query('otp') otp): Promise<any> {
    const status: SMSResponse = await this.otpService.verifyOTP({ phone, otp });
    return { status };
  }

  @Post('login')
  async login(@Body() user: any, @Headers('authorization') authHeader): Promise<any> {
      const encStatus = this.configResolverService.getEncryptionStatus(user.applicationId);
      if(encStatus){
        const encodedBase64Key = this.configResolverService.getEncryptionKey(user.applicationId);
        const parsedBase64Key = encodedBase64Key === undefined? CryptoJS.enc.Base64.parse('bla'): CryptoJS.enc.Base64.parse(encodedBase64Key);
        user.loginId = this.apiService.decrypt(user.loginId, parsedBase64Key);
        user.password = this.apiService.decrypt(user.password, parsedBase64Key);
      } 
      const status: SignupResponse = await this.apiService.login(user, authHeader);
      return status;
  }

  @Post('login/pin')
  async loginByPin(@Body() user: any, @Headers('authorization') authHeader): Promise<any> {
      const encStatus = this.configResolverService.getEncryptionStatus(user.applicationId);
      const encodedBase64Key = this.configResolverService.getEncryptionKey(user.applicationId);
      const parsedBase64Key = encodedBase64Key === undefined? CryptoJS.enc.Base64.parse('bla'): CryptoJS.enc.Base64.parse(encodedBase64Key);
      if(encStatus){
        user.loginId = this.apiService.decrypt(user.loginId, parsedBase64Key);
        // user.password = this.apiService.decrypt(user.password, parsedBase64Key);
      }else{
        user.password = this.apiService.encrypt(user.password, parsedBase64Key);
      }

      const status: SignupResponse = await this.apiService.login(user, authHeader);
      return status;
  }

  //
  @Get('all')
  async fetchUsers(@Query() data: {
    startRow: number;
    numberOfResults: number;
  }, @Headers('authorization') authHeader, @Headers('x-application-id') applicationId): Promise<UsersResponse> {
    const users: UsersResponse = await this.apiService.fetchUsers(applicationId, data.startRow, data.numberOfResults, authHeader);
    return users;
  }

  @Post('changePassword')
  async updatePassword(
    @Body() data: { loginId: string, password: string },
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId
  ): Promise<SignupResponse> {
    const status: SignupResponse = await this.apiService.updatePassword(data, applicationId, authHeader);
    return status;
  }

  @Post('changePin')
  async updatePin(
    @Body() data: { loginId: string, password: string },
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId
  ): Promise<SignupResponse> {
    const encodedBase64Key = this.configResolverService.getEncryptionKey(applicationId);
    const parsedBase64Key = encodedBase64Key === undefined? CryptoJS.enc.Base64.parse('bla'): CryptoJS.enc.Base64.parse(encodedBase64Key);
    data.password = this.apiService.encrypt(data.password, parsedBase64Key);
    const status: SignupResponse = await this.apiService.updatePassword(data, applicationId, authHeader);
    return status;
  }

  @Post('signup')
  async createUser(@Body() data: UserRegistration, @Headers('authorization') authHeader, @Headers('x-application-id') applicationId): Promise<SignupResponse> {
    const users: SignupResponse = await this.apiService.createUser(data, applicationId, authHeader);
    return users;
  }

  @Post('signupByPin')
  async createUserByPin(@Body() data: UserRegistration, @Headers('authorization') authHeader, @Headers('x-application-id') applicationId): Promise<SignupResponse> {
    const users: SignupResponse = await this.apiService.createUserByPin(data, applicationId, authHeader);
    return users;
  }

  @Patch('updateUser/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() data: User,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId
  ): Promise<SignupResponse> {
    const user: SignupResponse = await this.apiService.updateUser(userId, data, applicationId, authHeader);
    return user;
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
    @Headers('x-application-id') applicationId
  ): Promise<UsersResponse> {
    console.log(query.numberOfResults);
    const users: UsersResponse = await this.apiService.fetchUsersByString(
      query.queryString,
      query.startRow,
      query.numberOfResults,
      applicationId,
      authHeader
    );
    return users;
  }

  @Get('user/:userId')
  async searchUserbyId(
    @Param('userId') userId: string,
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId
  ): Promise<UsersResponse> {
    const users: UsersResponse = await this.apiService.fetchUsersByString(
      userId,
      undefined,
      undefined,
      applicationId,
      authHeader
    );
    return users;
  }

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
}
