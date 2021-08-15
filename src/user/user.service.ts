import * as addressSchema from './schema/address.json';
import * as educationSchema from './schema/education.json';
import * as userSchema from './schema/user.json';

import Ajv from 'ajv';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { Injectable } from '@nestjs/common';
import { SignupResponse } from './user.interface';
import { UserDBService } from './user-db/user-db.service';
import { v4 as uuidv4 } from 'uuid';

// ajv.addSchema(educationSchema, 'education');
// ajv.addSchema(userSchema, 'user');

@Injectable()
export class UserService {
  ajv;

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
    return validate(userData);
  }

  async signup(user: any): Promise<SignupResponse> {
    // Verify user
    const isValid = this.verifyUserObject(user);
    const response: SignupResponse = new SignupResponse().init(uuidv4());

    if (isValid) {
      // Add teacher to DB
      const dbObj: any = this.getDBParams(user);
      const status: boolean = await this.userDBService.persist(dbObj);

      // Add teacher to FusionAuth
      const authObj = this.getAuthParams(user);
      const statusFA: boolean = await this.fusionAuthService.persist(authObj);

      if (status && statusFA) {
      }
    } else {
    }
    return response;
  }

  getAuthParams(user: any) {
    throw new Error('Method not implemented.');
  }
  getDBParams(user: any): any {
    throw new Error('Method not implemented.');
  }
}
