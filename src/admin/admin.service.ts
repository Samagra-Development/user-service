import { Error, User, UserRequest, UUID } from '@fusionauth/typescript-client';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ResponseCode,
  ResponseStatus,
  SignupResponse,
  UsersResponse,
} from './admin.interface';
import { FAStatus, FusionauthService } from './fusionauth/fusionauth.service';
import { v4 as uuidv4 } from 'uuid';
import { catchError, map, throwError } from 'rxjs';
import { resolve } from 'path';
import { rejects } from 'assert';

@Injectable()
export class AdminService {
  constructor(
    private readonly fusionAuthService: FusionauthService,
    private readonly httpService: HttpService,
  ) {}

  async fetchUsers(req: any): Promise<UsersResponse> {
    const { total, users }: { total: number; users: Array<User> } =
      await this.fusionAuthService.getUsers(
        req.applicationId,
        req.startRow,
        req.numberOfResults,
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

  async fetchUsersByString(
    queryString: string,
    startRow: number,
    numberOfResults: number,
  ): Promise<UsersResponse> {
    const { total, users }: { total: number; users: Array<User> } =
      await this.fusionAuthService.getUsersByString(
        queryString,
        startRow,
        numberOfResults,
      );
    const response: UsersResponse = new UsersResponse().init(uuidv4());
    console.log(response);
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

  async updatePassword(data: {loginId: string, password: string}): Promise<any> {
      return this.fusionAuthService.changePassword(data);
  }

  async createUser(data: User): Promise<SignupResponse> {
    const { userId, user, err }: { userId: UUID; user: User; err: Error } =
      await this.fusionAuthService.createUser({user: data});
    if (userId == null || user == null) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = user;
    return response;
  }

  async updateUser(userId: string, data: User): Promise<any> {
    const { _userId, user, err }: { _userId: UUID; user: User; err: Error } =
      await this.fusionAuthService.updateUser(userId, {user: data});
    if (_userId == null || user == null) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
    const response: SignupResponse = new SignupResponse().init(uuidv4());
    response.result = user;
    return response;
  }
}
