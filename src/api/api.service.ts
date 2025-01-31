import {
  Error,
  LoginResponse,
  User,
  UUID,
} from '@fusionauth/typescript-client';
import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RefreshTokenResult,
  ResponseCode,
  ResponseStatus,
  SignupResponse,
  UserRegistration,
  UsersResponse,
} from './api.interface';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { OtpService } from './otp/otp.service';
import { v4 as uuidv4 } from 'uuid';
import { ConfigResolverService } from './config.resolver.service';
import { RefreshRequest } from '@fusionauth/typescript-client/build/src/FusionAuthClient';
import { FAStatus } from '../user/fusionauth/fusionauth.service';
import { ChangePasswordDTO } from '../user/dto/changePassword.dto';
import { SMSResponseStatus } from '../user/sms/sms.interface';
import { LoginDto } from '../user/dto/login.dto';
import { FusionAuthUserRegistration } from '../admin/admin.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CryptoJS = require('crypto-js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AES = require('crypto-js/aes');
import Flagsmith from 'flagsmith-nodejs';
import { LoginWithUniqueIdDto } from './dto/login.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
const jwksClient = require('jwks-rsa');
import * as jwt from 'jsonwebtoken';
import { GupshupWhatsappService } from './sms/gupshupWhatsapp/gupshupWhatsapp.service';

CryptoJS.lib.WordArray.words;

@Injectable()
export class ApiService {
  private client: any;
  private getKey: any;
  encodedBase64Key;
  parsedBase64Key;
  constructor(
    private configService: ConfigService,
    private readonly fusionAuthService: FusionauthService,
    private readonly otpService: OtpService,
    private readonly configResolverService: ConfigResolverService,
    @InjectRedis() private readonly redis: Redis,
    private readonly gupshupWhatsappService: GupshupWhatsappService,
  ) {
    this.client = jwksClient({
      jwksUri: this.configService.get('JWKS_URI'),
      requestHeaders: {}, // Optional
      timeout: 30000, // Defaults to 30s
    });

    this.getKey = (header: jwt.JwtHeader, callback: any) => {
      this.client.getSigningKey(header.kid, (err, key: any) => {
        if (err) {
          console.error(`Error fetching signing key: ${err}`);
          callback(err);
        } else {
          const signingKey = key.publicKey || key.rsaPublicKey;
          callback(null, signingKey);
        }
      });
    };
  }

  login(user: any, authHeader: string): Promise<SignupResponse> {
    return this.fusionAuthService
      .login(user, authHeader)
      .then(async (resp: ClientResponse<LoginResponse>) => {
        let fusionAuthUser: any = resp.response;
        if (fusionAuthUser.user === undefined) {
          fusionAuthUser = fusionAuthUser.loginResponse.successResponse;
        }
        if (
          fusionAuthUser?.user?.registrations?.filter((registration) => {
            return registration.applicationId == user.applicationId;
          }).length == 0
        ) {
          // User is not registered in the requested application. Let's throw error.
          const response: SignupResponse = new SignupResponse().init(uuidv4());
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'INVALID_REGISTRATION';
          response.params.errMsg =
            'User registration not found in the given application.';
          response.params.status = ResponseStatus.failure;
          return response;
        }
        // if (fusionAuthUser.user.data.accountName === undefined) {
        //   if (fusionAuthUser.user.fullName == undefined) {
        //     if (fusionAuthUser.user.firstName === undefined) {
        //       if(encStatus){
        //         fusionAuthUser['user']['data']['accountName'] = this.decrypt(
        //           user.loginId, this.parsedBase64Key
        //         );
        //       }else {
        //         fusionAuthUser['user']['data']['accountName'] = user.loginId;
        //       }

        //     } else {
        //       fusionAuthUser['user']['data']['accountName'] =
        //         fusionAuthUser.user.firstName;
        //     }
        //   } else {
        //     fusionAuthUser['user']['data']['accountName'] =
        //       fusionAuthUser.user.fullName;
        //   }
        // }
        const response: SignupResponse = new SignupResponse().init(uuidv4());
        response.responseCode = ResponseCode.OK;
        response.result = {
          responseMsg: 'Successful Logged In',
          accountStatus: null,
          data: {
            user: fusionAuthUser,
          },
        };
        if (
          this.configService.get('USE_FLAGSMITH') === 'true' &&
          this.configService.get('FLAGSMITH_ENVIRONMENT_KEY')
        ) {
          const flagsmith = new Flagsmith({
            environmentKey: this.configService.get('FLAGSMITH_ENVIRONMENT_KEY'),
          });
          await flagsmith.getIdentityFlags(fusionAuthUser.user.username, [
            'role',
          ]);
        }
        return response;
      })
      .catch((errorResponse: ClientResponse<LoginResponse>): SignupResponse => {
        // console.log(errorResponse);
        const response: SignupResponse = new SignupResponse().init(uuidv4());
        if (errorResponse.statusCode === 404) {
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'INVALID_USERNAME_PASSWORD';
          response.params.errMsg = 'Invalid Username/Password';
          response.params.status = ResponseStatus.failure;
        } else if (errorResponse.statusCode === 409) {
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'ACCOUNT_LOCKED';
          response.params.errMsg =
            'Multiple failed login attempts. Please retry again later.';
          response.params.status = ResponseStatus.failure;
        } else {
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'UNCAUGHT_EXCEPTION';
          response.params.errMsg = 'Server Failure';
          response.params.status = ResponseStatus.failure;
        }
        return response;
      });
  }

  loginByPin(user: any, authHeader: string): Promise<SignupResponse> {
    this.encodedBase64Key = this.configResolverService.getEncryptionKey(
      user.applicationId,
    );
    this.parsedBase64Key =
      this.encodedBase64Key === undefined
        ? CryptoJS.enc.Base64.parse('bla')
        : CryptoJS.enc.Base64.parse(this.encodedBase64Key);
    return this.fusionAuthService
      .login(user, authHeader)
      .then(async (resp: ClientResponse<LoginResponse>) => {
        let fusionAuthUser: any = resp.response;
        if (fusionAuthUser.user === undefined) {
          fusionAuthUser = fusionAuthUser.loginResponse.successResponse;
        }
        // if (fusionAuthUser.user.data.accountName === undefined) {
        //   if (fusionAuthUser.user.fullName == undefined) {
        //     if (fusionAuthUser.user.firstName === undefined) {
        //       fusionAuthUser['user']['data']['accountName'] = this.decrypt(
        //         user.loginId, this.parsedBase64Key
        //       );
        //     } else {
        //       fusionAuthUser['user']['data']['accountName'] =
        //         fusionAuthUser.user.firstName;
        //     }
        //   } else {
        //     fusionAuthUser['user']['data']['accountName'] =
        //       fusionAuthUser.user.fullName;
        //   }
        // }
        const response: SignupResponse = new SignupResponse().init(uuidv4());
        response.responseCode = ResponseCode.OK;
        response.result = {
          responseMsg: 'Successful Logged In',
          accountStatus: null,
          data: {
            user: fusionAuthUser,
          },
        };
        return response;
      })
      .catch((errorResponse: ClientResponse<LoginResponse>): SignupResponse => {
        console.log(errorResponse);
        const response: SignupResponse = new SignupResponse().init(uuidv4());
        if (errorResponse.statusCode === 404) {
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'INVALID_USERNAME_PASSWORD';
          response.params.errMsg = 'Invalid Username/Password';
          response.params.status = ResponseStatus.failure;
        } else {
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'UNCAUGHT_EXCEPTION';
          response.params.errMsg = 'Server Failure';
          response.params.status = ResponseStatus.failure;
        }
        return response;
      });
  }

  async fetchUsers(
    applicationId: string,
    startRow?: number,
    numberOfResults?: number,
    authHeader?: string,
  ): Promise<UsersResponse> {
    const { total, users }: { total: number; users: Array<User> } =
      await this.fusionAuthService.getUsers(
        applicationId,
        startRow,
        numberOfResults,
        authHeader,
      );
    const response: UsersResponse = new UsersResponse().init(uuidv4());
    if (users != null) {
      response.responseCode = ResponseCode.OK;
      response.params.status = ResponseStatus.success;
      response.result = { total, users };
    } else {
      response.responseCode = ResponseCode.FAILURE;
      response.params.status = ResponseStatus.failure;
      response.params.errMsg = 'No users found';
      response.params.err = 'NO_USERS_FOUND';
    }
    return response;
  }

  async updatePassword(
    data: { loginId: string; password: string },
    applicationId: string,
    authHeader?: string,
  ): Promise<any> {
    return this.fusionAuthService.updatePasswordWithLoginId(
      data,
      applicationId,
      authHeader,
    );
  }

  async createUser(
    data: UserRegistration,
    applicationId: string,
    authHeader?: string,
  ): Promise<SignupResponse> {
    const { userId, user, err }: { userId: UUID; user: User; err: Error } =
      await this.fusionAuthService.createAndRegisterUser(
        data,
        applicationId,
        authHeader,
      );
    if (userId == null || user == null) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = user;
    return response;
  }

  async createUserByPin(
    data: UserRegistration,
    applicationId: string,
    authHeader?: string,
  ): Promise<SignupResponse> {
    const encodedBase64Key =
      this.configResolverService.getEncryptionKey(applicationId);
    const parsedBase64Key =
      encodedBase64Key === undefined
        ? CryptoJS.enc.Base64.parse('bla')
        : CryptoJS.enc.Base64.parse(encodedBase64Key);
    data.user.password = this.encrypt(data.user.password, parsedBase64Key);
    const { userId, user, err }: { userId: UUID; user: User; err: Error } =
      await this.fusionAuthService.createAndRegisterUser(
        data,
        applicationId,
        authHeader,
      );
    if (userId == null || user == null) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = user;
    return response;
  }

  async updateUser(
    userId: string,
    data: User,
    applicationId: string,
    authHeader?: string,
  ): Promise<any> {
    const registrations: Array<FusionAuthUserRegistration> = data?.registrations
      ? data.registrations
      : [];
    delete data.registrations; // delete the registrations key

    const { _userId, user, err }: { _userId: UUID; user: User; err: Error } =
      await this.fusionAuthService.updateUser(
        userId,
        { user: data },
        applicationId,
        authHeader,
      );
    if (_userId == null || user == null) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }

    // if there are registrations Array, we'll update the registrations too
    for (const registration of registrations) {
      console.log(`Updating registration: ${JSON.stringify(registration)}`);
      await this.updateUserRegistration(
        applicationId,
        authHeader,
        userId,
        registration,
      ); // calling patch registration API
    }

    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = user;
    return response;
  }

  async fetchUsersByString(
    queryString: string,
    startRow: number,
    numberOfResults: number,
    applicationId: string,
    authHeader?: string,
  ): Promise<UsersResponse> {
    const { total, users }: { total: number; users: Array<User> } =
      await this.fusionAuthService.getUsersByString(
        queryString,
        startRow,
        numberOfResults,
        applicationId,
        authHeader,
      );
    const response: UsersResponse = new UsersResponse().init(uuidv4());
    if (users != null) {
      response.responseCode = ResponseCode.OK;
      response.params.status = ResponseStatus.success;
      response.result = { total, users };
    } else {
      response.responseCode = ResponseCode.FAILURE;
      response.params.status = ResponseStatus.failure;
      response.params.errMsg = 'No users found';
      response.params.err = 'NO_USERS_FOUND';
    }
    return response;
  }

  encrypt(plainString: any, key: string): any {
    return AES.encrypt(plainString, key, {
      mode: CryptoJS.mode.ECB,
    }).toString();
  }

  decrypt(encryptedString: any, key: string): any {
    return AES.decrypt(encryptedString, key, {
      mode: CryptoJS.mode.ECB,
    }).toString(CryptoJS.enc.Utf8);
  }

  async refreshToken(
    applicationId: string,
    refreshRequest: RefreshRequest,
    authHeader?: string,
  ): Promise<UsersResponse> {
    const refreshTokenResponse: RefreshTokenResult =
      await this.fusionAuthService.refreshToken(
        applicationId,
        refreshRequest,
        authHeader,
      );
    const response: UsersResponse = new UsersResponse().init(uuidv4());
    if (refreshTokenResponse.user.token !== null) {
      response.responseCode = ResponseCode.OK;
      response.params.status = ResponseStatus.success;
      response.result = refreshTokenResponse;
    } else {
      response.responseCode = ResponseCode.FAILURE;
      response.params.status = ResponseStatus.failure;
      response.params.errMsg =
        'Failed to refresh token. Please ensure the input you have provided is correct';
      response.params.err = 'REFRESH_TOKEN_FAILED';
    }

    return response;
  }

  async deactivateUserById(
    userId: string,
    hardDelete: boolean,
    applicationId: string,
    authHeader?: string,
  ): Promise<any> {
    const activationResponse: { userId: UUID; err: Error } =
      await this.fusionAuthService.deactivateUserById(
        userId,
        hardDelete,
        applicationId,
        authHeader,
      );
    if (activationResponse.userId == null) {
      throw new HttpException(activationResponse.err, HttpStatus.BAD_REQUEST);
    }

    // fetch the latest user info now & respond
    const userResponse = await this.fusionAuthService.getUserById(
      userId,
      applicationId,
      authHeader,
    );
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = userResponse.user;
    return response;
  }

  async activateUserById(
    userId: string,
    applicationId: string,
    authHeader?: string,
  ): Promise<any> {
    const activationResponse: { userId: UUID; err: Error } =
      await this.fusionAuthService.activateUserById(
        userId,
        applicationId,
        authHeader,
      );
    if (activationResponse.userId == null) {
      throw new HttpException(activationResponse.err, HttpStatus.BAD_REQUEST);
    }

    // fetch the latest user info now & respond
    const userResponse = await this.fusionAuthService.getUserById(
      userId,
      applicationId,
      authHeader,
    );
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = userResponse.user;
    return response;
  }

  async changePasswordOTP(
    username: string,
    applicationId: UUID,
    authHeader: null | string,
  ): Promise<SignupResponse> {
    // Get Phone No from username
    const {
      statusFA,
      userId,
      user,
    }: { statusFA: FAStatus; userId: UUID; user: User } =
      await this.fusionAuthService.getUser(username, applicationId, authHeader);
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    // If phone number is valid => Send OTP
    if (statusFA === FAStatus.USER_EXISTS) {
      const re = /^[6-9]{1}[0-9]{9}$/;
      if (re.test(user.mobilePhone)) {
        const result = await this.otpService.sendOTP(user.mobilePhone);
        response.result = {
          data: result,
          responseMsg: `OTP has been sent to ${user.mobilePhone}.`,
        };
        response.responseCode = ResponseCode.OK;
        response.params.status = ResponseStatus.success;
      } else {
        response.responseCode = ResponseCode.FAILURE;
        response.params.err = 'INVALID_PHONE_NUMBER';
        response.params.errMsg = 'Invalid Phone number';
        response.params.status = ResponseStatus.failure;
      }
    } else {
      response.responseCode = ResponseCode.FAILURE;
      response.params.err = 'INVALID_USERNAME';
      response.params.errMsg = 'No user with this Username exists';
      response.params.status = ResponseStatus.failure;
    }
    return response;
  }

  async changePassword(
    data: ChangePasswordDTO,
    applicationId: UUID,
    authHeader: null | string,
  ): Promise<SignupResponse> {
    // Verify OTP
    const {
      statusFA,
      userId,
      user,
    }: { statusFA: FAStatus; userId: UUID; user: User } =
      await this.fusionAuthService.getUser(
        data.username,
        applicationId,
        authHeader,
      );
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    if (statusFA === FAStatus.USER_EXISTS) {
      const verifyOTPResult = await this.otpService.verifyOTP({
        phone: user.mobilePhone,
        otp: data.OTP,
      });

      if (verifyOTPResult.status === SMSResponseStatus.success) {
        const result = await this.fusionAuthService.updatePassword(
          userId,
          data.password,
          applicationId,
          authHeader,
        );

        if (result.statusFA == FAStatus.SUCCESS) {
          response.result = {
            responseMsg: 'Password updated successfully',
          };
          response.responseCode = ResponseCode.OK;
          response.params.status = ResponseStatus.success;
        } else {
          response.responseCode = ResponseCode.FAILURE;
          response.params.err = 'UNCAUGHT_EXCEPTION';
          response.params.errMsg = 'Server Error';
          response.params.status = ResponseStatus.failure;
        }
      } else {
        response.responseCode = ResponseCode.FAILURE;
        response.params.err = 'INVALID_OTP_USERNAME_PAIR';
        response.params.errMsg = 'OTP and Username did not match.';
        response.params.status = ResponseStatus.failure;
      }
    } else {
      response.responseCode = ResponseCode.FAILURE;
      response.params.err = 'INVALID_USERNAME';
      response.params.errMsg = 'No user with this Username exists';
      response.params.status = ResponseStatus.failure;
    }
    return response;
  }

  async loginWithOtp(
    loginDto: LoginDto,
    authHeader: null | string,
  ): Promise<SignupResponse> {
    /* Execution flow
        1. Check if ALLOW_DEFAULT_OTP is set to true.
        2. If true check if user number is listed in DEFAULT_OTP_USERS, if yes send sucess if OTP matches.
        3. else; Verify OTP via fusion auth.
        2. If invalid OTP, throw error; else continue with next steps
        3. Check if user exists for the given applicationId.
        3.1. If existing user, reset the password.
        3.2. If new user, register to this application.
        4. Send login response with the token
     */
    const otp = loginDto.password;
    let phone = loginDto.loginId;
    let countryCode, number;
    if (phone.includes('-')) {
      [countryCode, number] = phone.split('-');
      phone = number;
    }
    const salt = this.configResolverService.getSalt(loginDto.applicationId);
    let verifyOTPResult;
    if (
      this.configService.get('ALLOW_DEFAULT_OTP') === 'true' &&
      this.configService.get('DEFAULT_OTP_USERS')
    ) {
      if (
        JSON.parse(this.configService.get('DEFAULT_OTP_USERS')).indexOf(
          loginDto.loginId,
        ) != -1
      ) {
        if (loginDto.password == this.configService.get('DEFAULT_OTP'))
          verifyOTPResult = { status: SMSResponseStatus.success };
        else verifyOTPResult = { status: SMSResponseStatus.failure };
      } else if (loginDto.deliveryType == 'WA') {
        loginDto.loginId = loginDto.loginId;
        const status: any = await this.gupshupWhatsappService.verifyWhatsappOTP(
          loginDto.loginId,
          loginDto.password,
        );
        if (status.status == 'success') {
          verifyOTPResult = { status: SMSResponseStatus.success };
        } else {
          verifyOTPResult = { status: SMSResponseStatus.failure };
        }
      } else {
        verifyOTPResult = await this.otpService.verifyOTP({
          phone: loginDto.loginId,
          otp: loginDto.password, // existing OTP
        });
      }
    } else {
      if (loginDto.deliveryType == 'WA') {
        loginDto.loginId = loginDto.loginId;
        const status: any = await this.gupshupWhatsappService.verifyWhatsappOTP(
          loginDto.loginId,
          loginDto.password,
        );
        if (status.status == 'success') {
          verifyOTPResult = { status: SMSResponseStatus.success };
        } else {
          verifyOTPResult = { status: SMSResponseStatus.failure };
        }
      } else {
        verifyOTPResult = await this.otpService.verifyOTP({
          phone: loginDto.loginId,
          otp: loginDto.password, // existing OTP
        });
      }
    }
    loginDto.password = salt + loginDto.password; // mix OTP with salt

    if (verifyOTPResult.status === SMSResponseStatus.success) {
      let response;
      const {
        statusFA,
        userId,
        user,
      }: { statusFA: FAStatus; userId: UUID; user: User } =
        await this.fusionAuthService.getUser(
          loginDto.loginId,
          loginDto.applicationId,
          authHeader,
        );
      if (statusFA === FAStatus.USER_EXISTS) {
        let registrationId = null,
          registeredRoles = [];
        if (user.registrations) {
          user.registrations.map((item) => {
            if (item.applicationId == loginDto.applicationId) {
              registrationId = item.id;
              registeredRoles = item.roles;
            }
          });
        }

        // now resetting user's password for the new OTP
        await this.updateUser(
          userId,
          {
            password: loginDto.password,
            registrations: [
              {
                applicationId: loginDto.applicationId,
                roles: registeredRoles,
                id: registrationId,
              },
            ],
            data: {
              loginId: loginDto.loginId,
              fingerprint: loginDto?.fingerprint,
              timestamp: loginDto?.timestamp,
              otp,
            },
          },
          loginDto.applicationId,
          authHeader,
        );
        response = await this.login(loginDto, authHeader);
      } else {
        // create a new user
        const createUserPayload: UserRegistration = {
          user: {
            timezone: 'Asia/Kolkata',
            username: loginDto.loginId,
            mobilePhone: loginDto.loginId,
            password: loginDto.password,
            data: {
              loginId: loginDto.loginId,
              fingerprint: loginDto?.fingerprint,
              timestamp: loginDto?.timestamp,
              otp,
            },
          },
          registration: {
            applicationId: loginDto.applicationId,
            preferredLanguages: ['en'],
            roles: loginDto.roles ?? [], // pass from request body if present, else empty list
          },
        };
        const { userId, user, err }: { userId: UUID; user: User; err: Error } =
          await this.fusionAuthService.createAndRegisterUser(
            createUserPayload,
            loginDto.applicationId,
            authHeader,
          );
        if (userId == null || user == null) {
          throw new HttpException(err, HttpStatus.BAD_REQUEST);
        }
        response = await this.login(loginDto, authHeader);
      }
      let existingJWTS: any = await this.redis.get(
        response?.result?.data?.user?.user?.id,
      );
      if (existingJWTS) {
        existingJWTS = JSON.parse(existingJWTS);
      } else {
        existingJWTS = [];
      }
      existingJWTS.push(response?.result?.data?.user?.token);
      await this.redis.set(
        response?.result?.data?.user?.user?.id,
        JSON.stringify(existingJWTS),
      );
      return response;
    } else {
      const response: SignupResponse = new SignupResponse().init(uuidv4());
      response.responseCode = ResponseCode.FAILURE;
      response.params.err = 'OTP_VERIFICATION_FAILED';
      response.params.errMsg = 'OTP verification failed.';
      response.params.status = ResponseStatus.failure;
      return response;
    }
  }

  async loginWithUniqueId(
    loginDto: LoginWithUniqueIdDto,
    authHeader: null | string,
  ): Promise<SignupResponse> {
    /* Execution flow
        1. Check if user exists for the given applicationId and loginId.
        3.1. If existing user, login user with default password.
        3.2. If new user, register to this application.
        4. Send login response with the token
     */
    const salt = this.configResolverService.getSalt(loginDto.applicationId);
    const password = salt + this.configService.get('DEFAULT_USER_PASSWORD'); // mix OTP with salt
    console.log(password);
    let response;

    const { statusFA }: { statusFA: FAStatus } =
      await this.fusionAuthService.getUser(
        loginDto.loginId,
        loginDto.applicationId,
        authHeader,
      );
    if (statusFA === FAStatus.USER_EXISTS) {
      response = await this.login({ ...loginDto, password }, authHeader);
    } else {
      // create a new user
      const createUserPayload: UserRegistration = {
        user: {
          timezone: 'Asia/Kolkata',
          username: loginDto.loginId,
          password: password,
        },
        registration: {
          applicationId: loginDto.applicationId,
          preferredLanguages: ['en'],
          roles: [],
        },
      };
      const { userId, user, err }: { userId: UUID; user: User; err: Error } =
        await this.fusionAuthService.createAndRegisterUser(
          createUserPayload,
          loginDto.applicationId,
          authHeader,
        );
      if (userId == null || user == null) {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      }
      response = await this.login({ ...loginDto, password }, authHeader);
    }
    let existingJWTS: any = await this.redis.get(
      response?.result?.data?.user?.user?.id,
    );
    if (existingJWTS) {
      existingJWTS = JSON.parse(existingJWTS);
    } else {
      existingJWTS = [];
    }
    existingJWTS.push(response?.result?.data?.user?.token);
    await this.redis.set(
      response?.result?.data?.user?.user?.id,
      JSON.stringify(existingJWTS),
    );
    return response;
  }

  async updateUserRegistration(
    applicationId: UUID,
    authHeader: null | string,
    userId: UUID,
    data: FusionAuthUserRegistration,
  ): Promise<any> {
    const {
      _userId,
      registration,
      err,
    }: { _userId: UUID; registration: FusionAuthUserRegistration; err: Error } =
      await this.fusionAuthService.updateUserRegistration(
        applicationId,
        authHeader,
        userId,
        data,
      );

    if (_userId == null || registration == null) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
    return registration;
  }

  async verifyFusionAuthJWT(token: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      jwt.verify(token, this.getKey, async (err, decoded) => {
        if (err) {
          console.error('APP JWT verification error:', err);
          resolve({
            isValidFusionAuthToken: false,
            claims: null,
          });
        } else {
          resolve({
            isValidFusionAuthToken: true,
            claims: decoded,
          });
        }
      });
    });
  }

  async verifyJWT(token: string): Promise<any> {
    const { isValidFusionAuthToken, claims } = await this.verifyFusionAuthJWT(
      token,
    );
    let existingUserJWTS: any = '[]';

    if (claims?.sub) {
      existingUserJWTS = JSON.parse(await this.redis.get(claims.sub));
    }

    if (!isValidFusionAuthToken) {
      if (existingUserJWTS.indexOf(token) != -1) {
        existingUserJWTS.splice(existingUserJWTS.indexOf(token), 1);
        await this.redis.set(claims.sub, JSON.stringify(existingUserJWTS));
      }
      return {
        isValid: false,
        message: 'Invalid/Expired token.',
      };
    }

    if (existingUserJWTS.indexOf(token) == -1) {
      return {
        isValid: false,
        message: 'Token is not authorized.',
      };
    }

    return {
      isValid: true,
      message: 'Token is valid.',
    };
  }

  async logout(token: string): Promise<any> {
    const { isValidFusionAuthToken, claims } = await this.verifyFusionAuthJWT(
      token,
    );
    if (isValidFusionAuthToken) {
      const existingUserJWTS: any = JSON.parse(
        await this.redis.get(claims.sub),
      );
      if (existingUserJWTS.indexOf(token) != -1) {
        existingUserJWTS.splice(existingUserJWTS.indexOf(token), 1);
        await this.redis.set(claims.sub, JSON.stringify(existingUserJWTS));
      }
      return {
        message: 'Logout successful. Token invalidated.',
      };
    } else {
      return {
        message: 'Invalid or expired token.',
      };
    }
  }
}
