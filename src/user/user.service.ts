import * as addressSchema from './schema/address.json';
import * as educationSchema from './schema/education.json';
import * as userSchema from './schema/user.json';

import {
  AccountStatus,
  ResponseCode,
  ResponseStatus,
  SignupResponse,
} from './user.interface';

import Ajv from 'ajv';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { Injectable } from '@nestjs/common';
import { UUID } from '@fusionauth/typescript-client';
import { UserDBService } from './user-db/user-db.service';
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

    if (isValid) {
      // Add teacher to FusionAuth
      const authObj = this.getAuthParams(user);
      const statusFA: UUID = await this.fusionAuthService.persist(authObj);

      // Add teacher to DB
      const dbObj: any = this.getDBParams(user);
      dbObj.user_id = statusFA;

      //TODO: Remove hacks
      delete dbObj.userID;
      delete dbObj.approved;
      dbObj.joining_date = dbObj.joiningData;
      delete dbObj.joiningData;
      const status: boolean = await this.userDBService.persist(dbObj);

      if (status && statusFA !== null) {
        console.log('All good');
        // Update response with correct status - SUCCESS.
        response.result = {
          responseMsg: 'User Saved Successfully',
          accountStatus: AccountStatus.PENDING,
          data: {
            userId: statusFA,
          },
        };
      }
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
    return response;
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
