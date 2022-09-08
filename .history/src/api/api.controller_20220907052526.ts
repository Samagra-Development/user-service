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
      if( authHeader != null){
          user['authHeader'] = authHeader;
      }
      const encStatus = this.configResolverService.getEncryptionStatus(user.applicationId);
      if(encStatus){
        user.loginId = this.apiService.encrypt(user.loginId);
        user.password = this.apiService.encrypt(user.password);
      } 
      const status: SignupResponse = await this.apiService.login(user);
      return status;
  }
  //
  @Post('all')
  async fetchUsers(@Body() data: any, @Headers('authorization') authHeader): Promise<UsersResponse> {
    if( authHeader != null){
        data['authHeader'] = authHeader;
    }
    const users: UsersResponse = await this.apiService.fetchUsers(data);
    return users;
  }

  @Post('changePassword')
  async updatePassword(
    @Body() data: { loginId: string, password: string, applicationId: string},
    @Headers('authorization') authHeader,
    @Headers('x-application-id') applicationId
  ): Promise<SignupResponse> {
    if( authHeader != null){
        data['authHeader'] = authHeader;
    }
    const status: SignupResponse = await this.apiService.updatePassword(data);
    return status;
  }

  @Post('signup')
  async createUser(@Body() data: UserRegistration, @Headers('authorization') authHeader, @Headers('x-application-id') applicationId): Promise<SignupResponse> {
    const users: SignupResponse = await this.apiService.createUser(data, applicationId, authHeader);
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
}
