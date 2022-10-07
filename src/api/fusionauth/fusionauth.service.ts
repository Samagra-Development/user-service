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
  Error,
  JWTRefreshResponse,
} from '@fusionauth/typescript-client';

import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map } from 'rxjs';
import { QueryGeneratorService } from './query-generator/query-generator.service';
import { ConfigResolverService } from '../config.resolver.service';
import { RefreshRequest } from '@fusionauth/typescript-client/build/src/FusionAuthClient';
import { RefreshTokenResult } from '../api.interface';

export enum FAStatus {
  SUCCESS = 'SUCCESS',
  USER_EXISTS = 'USER_EXISTS',
  ERROR = 'ERROR',
}

@Injectable()
export class FusionauthService {
  fusionauthClient: FusionAuthClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly queryGenService: QueryGeneratorService,
    private configResolverService: ConfigResolverService,
  ) {
    this.fusionauthClient = new FusionAuthClient(
      process.env.FUSIONAUTH_API_KEY,
      process.env.FUSIONAUTH_BASE_URL,
    );
  }

  getClient(apiKey: string, host: string): FusionAuthClient {
    return new FusionAuthClient(apiKey, host);
  }

  getUser(
    username: string,
  ): Promise<{ statusFA: FAStatus; userId: UUID; user: User }> {
    return this.fusionauthClient
      .retrieveUserByUsername(username)
      .then(
        (
          response: ClientResponse<UserResponse>,
        ): { statusFA: FAStatus; userId: UUID; user: User } => {
          console.log('Found user');
          return {
            statusFA: FAStatus.USER_EXISTS,
            userId: response.response.user.id,
            user: response.response.user,
          };
        },
      )
      .catch((e): { statusFA: FAStatus; userId: UUID; user: User } => {
        console.log(
          `Could not fetch user with username ${username}`,
          JSON.stringify(e),
        );
        return {
          statusFA: FAStatus.ERROR,
          userId: null,
          user: null,
        };
      });
  }

  getUsers(
    applicationId: string,
    startRow: number,
    numberOfResults: number,
    authHeader: string,
  ): Promise<{ total: number; users: Array<User> }> {
    const searchRequest = {
      search: {
        numberOfResults: numberOfResults,
        query: this.queryGenService.queryUsersByApplicationId(applicationId),
        sortFields: [
          {
            missing: 'username',
            name: 'fullName',
            order: Sort.asc,
          },
        ],
        startRow: startRow,
      },
    };
    let apiKey = this.configResolverService.getApiKey(applicationId);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    const host = this.configResolverService.getHost(applicationId);
    const fusionauthClient = this.getClient(apiKey, host);
    return fusionauthClient
      .searchUsersByQuery(searchRequest)
      .then(
        (
          response: ClientResponse<SearchResponse>,
        ): { total: number; users: Array<User> } => {
          console.log('Found users');
          return {
            total: response.response.total,
            users: response.response.users,
          };
        },
      )
      .catch((e): { total: number; users: Array<User> } => {
        console.log(
          `Could not fetch users for applicationId ${applicationId}`,
          JSON.stringify(e),
        );
        return {
          total: 0,
          users: null,
        };
      });
  }

  getUsersByString(
    queryString: string,
    startRow: number,
    numberOfResults: number,
    applicationId: string,
    authHeader?: string,
  ): Promise<{ total: number; users: Array<User> }> {
    const searchRequest = {
      search: {
        numberOfResults: numberOfResults,
        query: this.queryGenService.queryUsersByApplicationIdAndQueryString(
          [applicationId],
          queryString,
        ),
        sortFields: [
          {
            missing: 'username',
            name: 'fullName',
            order: Sort.asc,
          },
        ],
        startRow: startRow,
      },
    };
    let apiKey = this.configResolverService.getApiKey(applicationId);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    const host = this.configResolverService.getHost(applicationId);
    const fusionauthClient = this.getClient(apiKey, host);
    return fusionauthClient
      .searchUsersByQuery(searchRequest)
      .then(
        (
          response: ClientResponse<SearchResponse>,
        ): { total: number; users: Array<User> } => {
          console.log('Found users');
          return {
            total: response.response.total,
            users: response.response.users,
          };
        },
      )
      .catch((e): { total: number; users: Array<User> } => {
        console.log(`Could not fetch users`, JSON.stringify(e));
        return {
          total: 0,
          users: null,
        };
      });
  }

  updatePasswordWithUserId(
    userId: UUID,
    password: string,
  ): Promise<{ statusFA: FAStatus; userId: UUID }> {
    return this.fusionauthClient
      .patchUser(userId, {
        user: {
          password: password,
        },
      })
      .then((response) => {
        return {
          statusFA: FAStatus.SUCCESS,
          userId: response.response.user.id,
        };
      })
      .catch((response) => {
        console.log(JSON.stringify(response));
        return {
          statusFA: FAStatus.ERROR,
          userId: null,
        };
      });
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
    let resp;
    let resp1;
    const responses: Array<{ statusFA: FAStatus; userId: UUID }> = [];
    const registrations: Array<UserRegistration> = [];
    const currentRegistration: UserRegistration = {
      username: authObj.username,
      applicationId: process.env.FUSIONAUTH_APPLICATION_ID,
      roles: authObj.role,
    };
    const currentRegistration_samarth_hp: UserRegistration = {
      username: authObj.username,
      applicationId: process.env.FUSIONAUTH_SAMARTH_HP_APPLICATION_ID,
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
    const userRequest_samarth_hp: RegistrationRequest = {
      registration: currentRegistration_samarth_hp,
    };
    resp = this.fusionauthClient
      .register(undefined, userRequest)
      .then(
        (
          response: ClientResponse<RegistrationResponse>,
        ): { statusFA: FAStatus; userId: UUID } => {
          this.fusionauthClient
            .register(response.response.user.id, userRequest_samarth_hp)
            .then((res: ClientResponse<RegistrationResponse>): any => {
              console.log({ res });
            })
            .catch((e): Promise<{ statusFA: FAStatus; userId: UUID }> => {
              console.log('Could not create a user in', JSON.stringify(e));
              console.log('Trying to fetch an existing user in');
              return this.fusionauthClient
                .retrieveUserByUsername(authObj.username)
                .then((response: ClientResponse<UserResponse>): any => {
                  console.log('Found user in');
                })
                .catch((e): any => {
                  console.log(
                    `Could not fetch user with username in ${authObj.username}`,
                    JSON.stringify(e),
                  );
                });
            });
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
    return resp;
  }

  login(
    user: LoginRequest,
    authHeader: string,
  ): Promise<ClientResponse<LoginResponse>> {
    console.log(user);
    let apiKey = this.configResolverService.getApiKey(user.applicationId);
    console.log('here', apiKey);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    console.log({ apiKey });
    const host = this.configResolverService.getHost(user.applicationId);
    const fusionauthClient = this.getClient(apiKey, host);
    return fusionauthClient
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
            phone: authObj.phone,
            accountName: authObj.firstName,
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

  async createAndRegisterUser(
    user: RegistrationRequest,
    applicationId: string,
    authHeader: string,
  ): Promise<{ userId: UUID; user: User; err: Error }> {
    let apiKey = this.configResolverService.getApiKey(applicationId);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    const host = this.configResolverService.getHost(applicationId);
    const fusionauthClient = this.getClient(apiKey, host);
    return fusionauthClient
      .register(null, user)
      .then(
        (
          response: ClientResponse<RegistrationResponse>,
        ): { userId: UUID; user: User; err: Error } => {
          console.log('Found user');
          return {
            userId: response.response.user.id,
            user: response.response.user,
            err: null,
          };
        },
      )
      .catch((e): { userId: UUID; user: User; err: Error } => {
        console.log(`Could not create user ${user}`, JSON.stringify(e));
        return {
          userId: null,
          user: null,
          err: e,
        };
      });
  }

  async updateUser(
    userId: string,
    user: UserRequest,
    applicationId: string,
    authHeader?: string,
  ): Promise<{ _userId: UUID; user: User; err: Error }> {
    let apiKey = this.configResolverService.getApiKey(applicationId);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    const host = this.configResolverService.getHost(applicationId);
    const fusionauthClient = this.getClient(apiKey, host);
    return fusionauthClient
      .patchUser(userId, user)
      .then(
        (
          response: ClientResponse<UserResponse>,
        ): { _userId: UUID; user: User; err: Error } => {
          console.log('Found user');
          return {
            _userId: response.response.user.id,
            user: response.response.user,
            err: null,
          };
        },
      )
      .catch((e): { _userId: UUID; user: User; err: Error } => {
        console.log(`Could not update user ${user.user.id}`, JSON.stringify(e));
        return {
          _userId: null,
          user: null,
          err: e,
        };
      });
  }

  async upddatePasswordWithLoginId(
    data: { loginId: string; password: string },
    applicationId: string,
    authHeader?: string,
  ): Promise<any> {
    let apiKey = this.configResolverService.getApiKey(applicationId);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    const host = this.configResolverService.getHost(applicationId);
    return this.httpService
      .post(
        host + '/api/user/change-password',
        {
          loginId: data.loginId,
          password: data.password,
        },
        {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
        },
      )
      .pipe(
        map((response) =>
          response.status === 200
            ? { msg: 'Password changed successfully' }
            : { msg: 'Password cannot be changed' },
        ),
        catchError((e) => {
          throw new HttpException(
            { error: e.response.data },
            HttpStatus.BAD_REQUEST,
          );
        }),
      );
  }

  async refreshToken(
    applicationId: string,
    refreshRequest: RefreshRequest,
    authHeader?: string,
  ): Promise<RefreshTokenResult> {
    let apiKey = this.configResolverService.getApiKey(applicationId);
    if (authHeader != null) {
      apiKey = authHeader;
    }
    const host = this.configResolverService.getHost(applicationId);
    const fusionauthClient = this.getClient(apiKey, host);
    return fusionauthClient
      .exchangeRefreshTokenForJWT(refreshRequest)
      .then((response: ClientResponse<JWTRefreshResponse>) => {
        const token: string = response.response.token;
        const decodedToken = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString(),
        );
        return {
          user: {
            token: token,
            refreshToken: response.response.refreshToken,
            tokenExpirationInstant: decodedToken.exp * 1000, // convert to milli second same as login api
          },
        };
      })
      .catch((e): RefreshTokenResult => {
        console.log(`Could not update token`, JSON.stringify(e));
        return {
          user: {
            token: null,
            refreshToken: null,
            tokenExpirationInstant: null,
          },
        };
      });
  }
}
