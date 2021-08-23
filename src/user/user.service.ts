import * as addressSchema from './schema/address.json';
import * as educationSchema from './schema/education.json';
import * as userSchema from './schema/user.json';

import {
  AccountStatus,
  ResponseCode,
  ResponseStatus,
  SignupResponse,
} from './user.interface';
import { FAStatus, FusionauthService } from './fusionauth/fusionauth.service';
import { LoginResponse, UUID } from '@fusionauth/typescript-client';

import Ajv from 'ajv';
import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import { Injectable } from '@nestjs/common';
import { UserDBService } from './user-db/user-db.service';
import { response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// ajv.addSchema(educationSchema, 'education');
// ajv.addSchema(userSchema, 'user');

@Injectable()
export class UserService {
  ajv;

  createCopy = (obj) => JSON.parse(JSON.stringify(obj));
  dbKeys = [
    'userID',
    'school',
    'subjects',
    'employment',
    'joiningData',
    'approved',
    'cadre',
    'designation',
  ];

  constructor(
    private readonly userDBService: UserDBService,
    private readonly fusionAuthService: FusionauthService,
  ) {
    this.ajv = new Ajv({ strict: false });
    this.ajv.addSchema(addressSchema, 'address');
    this.ajv.addSchema(educationSchema, 'education');
    this.ajv.addSchema(userSchema, 'user');
  }

  verifyUserObject(userData: any): boolean {
    const validate = this.ajv.compile(userSchema);
    const isValid = validate(userData);
    return isValid;
  }

  async signup(user: any): Promise<SignupResponse> {
    // Verify user
    const isValid = this.verifyUserObject(user);
    const response: SignupResponse = new SignupResponse().init(uuidv4());

    const schoolValidity = await this.userDBService.getSchool(
      user.request.school,
    );

    if (!schoolValidity.status) {
      response.responseCode = ResponseCode.FAILURE;
      response.params.err = 'SIGNUP_DB_FAIL';
      response.params.errMsg = 'School does not exist';
      response.params.status = ResponseStatus.failure;
      return response;
    } else {
      user.request.school = schoolValidity.id;
    }

    if (isValid) {
      // Add teacher to FusionAuth
      const authObj = this.getAuthParams(user);
      authObj.school = user.request.school;
      const { statusFA, userId }: { statusFA: FAStatus; userId: UUID } =
        await this.fusionAuthService.persist(authObj);

      if (statusFA === FAStatus.USER_EXISTS) {
        response.responseCode = ResponseCode.FAILURE;
        response.params.err = 'SIGNUP_FA_FAIL';
        response.params.errMsg =
          'Seems like a user with the same username exists. Please try to log in if you have already account approved or try to create an account with your phone number as the username.';
        response.params.status = ResponseStatus.failure;
      } else {
        // Add teacher to DB
        const dbObj: any = this.getDBParams(user);
        dbObj.user_id = userId;

        //TODO: Remove hacks
        delete dbObj.userId;
        delete dbObj.approved;
        dbObj.joining_date = dbObj.joiningData;
        delete dbObj.joiningData;
        const status: boolean = await this.userDBService.persist(dbObj);

        if (status && statusFA === FAStatus.SUCCESS) {
          console.log('All good');
          // Update response with correct status - SUCCESS.
          response.result = {
            responseMsg: 'User Saved Successfully',
            accountStatus: AccountStatus.PENDING,
            data: {
              userId: userId,
            },
          };
        } else {
          // Update response with correct status - ERROR.
          response.responseCode = ResponseCode.FAILURE;
          if (!status) {
            response.params.err = 'SIGNUP_DB_FAIL';
            response.params.errMsg = 'Could not save in UserDB';
            response.params.status = ResponseStatus.failure;
          } else {
            response.params.err = 'SIGNUP_FA_FAIL';
            response.params.errMsg = 'Could not save in FusionAuth';
            response.params.status = ResponseStatus.failure;
          }
        }
      }
    } else {
      response.responseCode = ResponseCode.FAILURE;
      response.params.err = 'INVALID_SCHEMA';
      response.params.errMsg = 'Invalid Request';
      response.params.status = ResponseStatus.failure;
    }
    return response;
  }

  update(user: any): PromiseLike<SignupResponse> {
    return this.fusionAuthService
      .update(user)
      .then((s) => {
        return this.userDBService
          .update(user)
          .then((s2) => s2)
          .catch((e) => {
            console.error(e);
            //rollback
            return null;
          });
      })
      .catch((e) => {
        console.error(e);
        //rollback
        return null;
      });
  }

  login(user: any): PromiseLike<SignupResponse> {
    console.log(this.fusionAuthService);
    return this.fusionAuthService
      .login(user)
      .then((response: ClientResponse<LoginResponse>) => {
        const fusionAuthUser: LoginResponse = response.response;
        console.log(fusionAuthUser.user.id);
        return this.userDBService
          .getUserById(fusionAuthUser.user.id)
          .then((userDBResponse) => userDBResponse.results[0])
          .then((userDBResponse): SignupResponse => {
            const response: SignupResponse = new SignupResponse().init(
              uuidv4(),
            );
            response.responseCode = ResponseCode.OK;
            console.log(userDBResponse);
            response.result = {
              responseMsg: 'Successful Logged In',
              accountStatus: AccountStatus[userDBResponse.account_status],
              data: {
                user: fusionAuthUser,
                schoolResponse: userDBResponse,
              },
            };
            return response;
          })
          .catch((e: ClientResponse<LoginResponse>): SignupResponse => {
            console.log(e);
            const response: SignupResponse = new SignupResponse().init(
              uuidv4(),
            );
            response.responseCode = ResponseCode.FAILURE;
            response.params.err = 'UNCAUGHT_EXCEPTION';
            response.params.errMsg = 'Server Failure';
            response.params.status = ResponseStatus.failure;
            return response;
          });
      })
      .catch((errorResponse: ClientResponse<LoginResponse>): SignupResponse => {
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

  getAuthParams(user: any) {
    const userCopy = this.createCopy(user).request;
    for (let i = 0; i < this.dbKeys.length; i++) {
      delete userCopy[this.dbKeys[i]];
    }
    return userCopy;
  }

  getDBParams(user: any): any {
    const userCopy = {};
    for (let i = 0; i < this.dbKeys.length; i++) {
      userCopy[this.dbKeys[i]] = user.request[this.dbKeys[i]];
    }
    return userCopy;
  }
}
