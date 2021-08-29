import FusionAuthClient, {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
  SearchRequest,
  SearchResponse,
  Sort,
  UUID,
  User,
  UserRegistration,
  UserRequest,
  UserResponse,
} from '@fusionauth/typescript-client';

import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import { Injectable } from '@nestjs/common';

export enum FAStatus {
  SUCCESS = 'SUCCESS',
  USER_EXISTS = 'USER_EXISTS',
  ERROR = 'ERROR',
}

@Injectable()
export class FusionauthService {
  fusionauthClient: FusionAuthClient;

  constructor() {
    this.fusionauthClient = new FusionAuthClient(
      process.env.FUSIONAUTH_API_KEY,
      process.env.FUSIONAUTH_BASE_URL,
    );
  }

  delete(userId: UUID): Promise<any> {
    return this.fusionauthClient
      .deleteUser(userId)
      .then((response) => {
        console.log(response);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  persist(authObj: any): Promise<{ statusFA: FAStatus; userId: UUID }> {
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
          udise: authObj.udise,
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

    return this.fusionauthClient
      .register(undefined, userRequest)
      .then(
        (
          response: ClientResponse<RegistrationResponse>,
        ): { statusFA: FAStatus; userId: UUID } => {
          console.log({ response });
          return {
            statusFA: FAStatus.SUCCESS,
            userId: response.response.user.id,
          };
        },
      )
      .catch((e): Promise<{ statusFA: FAStatus; userId: UUID }> => {
        console.log('Could not create a user', JSON.stringify(e));
        console.log('Trying to fetch an existing user');
        return this.fusionauthClient
          .retrieveUserByUsername(authObj.username)
          .then(
            (
              response: ClientResponse<UserResponse>,
            ): { statusFA: FAStatus; userId: UUID } => {
              console.log('Found user');
              return {
                statusFA: FAStatus.USER_EXISTS,
                userId: response.response.user.id,
              };
            },
          )
          .catch((e): { statusFA: FAStatus; userId: UUID } => {
            console.log(
              `Could not fetch user with username ${authObj.username}`,
              JSON.stringify(e),
            );
            return {
              statusFA: FAStatus.ERROR,
              userId: null,
            };
          });
      });
  }

  login(user: LoginRequest): Promise<ClientResponse<LoginResponse>> {
    return this.fusionauthClient
      .login(user)
      .then((response: ClientResponse<LoginResponse>): any => {
        return response;
      })
      .catch((e) => {
        throw e;
      });
  }

  update(
    userID: UUID,
    authObj: any,
    isSimpleUpdate = false,
  ): Promise<{ statusFA: FAStatus; userId: UUID; fusionAuthUser: User }> {
    let userRequest: UserRequest;
    if (!isSimpleUpdate) {
      const registrations: Array<UserRegistration> = [];
      const currentRegistration: UserRegistration = {
        username: authObj.username,
        applicationId: process.env.FUSIONAUTH_APPLICATION_ID,
        roles: authObj.role,
      };
      registrations.push(currentRegistration);

      userRequest = {
        user: {
          active: true,
          data: {
            school: authObj.school,
            education: authObj.education,
            address: authObj.address,
            gender: authObj.gender,
            dateOfRetirement: authObj.dateOfRetirement,
            phoneVerified: false,
            udise: authObj.udise,
          },
          email: authObj.email,
          firstName: authObj.firstName,
          lastName: authObj.lastName,
          fullName: authObj.fullName,
          username: authObj.username,
          password: authObj.password,
          imageUrl: authObj.avatar,
          mobilePhone: authObj.phone,
        },
      };
    } else {
      userRequest = {
        user: authObj,
      };
    }

    return this.fusionauthClient
      .patchUser(userID, userRequest)
      .then(
        (
          response: ClientResponse<UserResponse>,
        ): { statusFA: FAStatus; userId: UUID; fusionAuthUser: User } => {
          console.log({ response });
          return {
            statusFA: FAStatus.SUCCESS,
            userId: response.response.user.id,
            fusionAuthUser: response.response.user,
          };
        },
      )
      .catch(
        (e): { statusFA: FAStatus; userId: UUID; fusionAuthUser: User } => {
          console.log('Unable to update user', JSON.stringify(e));
          return {
            statusFA: FAStatus.ERROR,
            userId: null,
            fusionAuthUser: null,
          };
        },
      );
  }

  verifyUsernamePhoneCombination(): Promise<boolean> {
    return Promise.resolve(true);
  }

  //One time Task
  async updateAllEmptyRolesToSchool(): Promise<any> {
    let allDone = false;
    const searchRequest: SearchRequest = {
      search: {
        numberOfResults: 15,
        startRow: 0,
        sortFields: [
          {
            missing: '_first',
            name: 'id',
            order: Sort.asc,
          },
        ],
        query:
          '{"bool":{"must":[{"nested":{"path":"registrations","query":{"bool":{"must":[{"match":{"registrations.applicationId":"f0ddb3f6-091b-45e4-8c0f-889f89d4f5da"}}],"must_not":[{"match":{"registrations.roles":"school"}}]}}}}]}}',
      },
    };
    let iteration = 0;
    let invalidUsersCount = 0;
    while (!allDone) {
      iteration += 1;
      searchRequest.search.startRow = invalidUsersCount;
      const resp: ClientResponse<SearchResponse> =
        await this.fusionauthClient.searchUsersByQuery(searchRequest);
      const total = resp.response.total;
      console.log(iteration, total);
      if (total === 0) allDone = true;
      else {
        const users: Array<User> = resp.response.users;
        for (const user of users) {
          if (user.registrations[0].roles === undefined) {
            user.registrations[0].roles = ['school'];
            console.log('Here', user);
            await this.fusionauthClient
              .updateRegistration(user.id, {
                registration: user.registrations[0],
              })
              .then((resp) => {
                console.log('response', JSON.stringify(resp));
              })
              .catch((e) => {
                console.log('error', JSON.stringify(e));
              });
          } else {
            console.log('Invalid User', user.id);
            invalidUsersCount += 1;
          }
        }
      }
    }
  }
}
