import FusionAuthClient, {
  RegistrationRequest,
  RegistrationResponse,
  UUID,
  UserRegistration,
  UserResponse,
  LoginRequest,
  LoginResponse,
} from '@fusionauth/typescript-client';

import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import { Injectable } from '@nestjs/common';
import { response } from 'express';
import { SignupResponse } from '../user.interface';

@Injectable()
export class FusionauthService {
  fusionauthClient: FusionAuthClient;

  constructor() {
    this.fusionauthClient = new FusionAuthClient(
      process.env.FUSIONAUTH_API_KEY,
      process.env.FUSIONAUTH_BASE_URL,
    );
  }

  persist(authObj: any): Promise<UUID> {
    console.log(authObj);
    const registrations: Array<UserRegistration> = [];
    const currentRegistration: UserRegistration = {
      username: authObj.username,
      applicationId: process.env.FUSIONAUTH_APPLICATION_ID,
      roles: authObj.role,
    };
    registrations.push(currentRegistration);
    const userRequest: RegistrationRequest = {
      user: {
        active: true,
        data: {
          school: authObj.school,
          education: authObj.education,
          address: authObj.address,
          gender: authObj.gender,
          dateOfRetirement: authObj.dateOfRetirement,
          phoneVerified: false,
        },
        email: authObj.email,
        firstName: authObj.firstName,
        lastName: authObj.lastName,
        username: authObj.username,
        password: authObj.password,
        imageUrl: authObj.avatar,
        mobilePhone: authObj.phone,
      },
      registration: currentRegistration,
    };

    console.log(userRequest);

    return this.fusionauthClient
      .register(undefined, userRequest)
      .then((response: ClientResponse<RegistrationResponse>): UUID => {
        console.log({ response });
        return response.response.user.id;
      })
      .catch((e): Promise<UUID> => {
        console.log('Could not create a user', JSON.stringify(e));
        console.log('Trying to fetch an existing user');
        return this.fusionauthClient
          .retrieveUserByUsername(authObj.username)
          .then((response: ClientResponse<UserResponse>): UUID => {
            console.log('Found user');
            return response.response.user.id;
          })
          .catch((e) => {
            console.log(
              `Could not fetch user with username ${authObj.username}`,
              JSON.stringify(e),
            );
            return null;
          });
      });
  }

  login(user: LoginRequest): PromiseLike<any> {
    return this.fusionauthClient
      .login(user)
      .then((response: ClientResponse<LoginResponse>): any => {
        return response.response;
      });
  }

  update(user: any): Promise<SignupResponse> {
    throw new Error('Method not implemented.');
  }

  verifyUsernamePhoneCombination(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
