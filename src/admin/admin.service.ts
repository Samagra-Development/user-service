import { User } from '@fusionauth/typescript-client';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ResponseCode, ResponseStatus, UsersResponse } from './admin.interface';
import { FusionauthService } from './fusionauth/fusionauth.service';
import { v4 as uuidv4 } from 'uuid';
import { catchError, map } from 'rxjs';

@Injectable()
export class AdminService {
    constructor(
        private readonly fusionAuthService: FusionauthService,
        private readonly httpService: HttpService,
      ) {}

    async fetchUsers(req: any): Promise<UsersResponse> {
        const {
          total,
          users,
        }: { total: number; users: Array<User> } =
          await this.fusionAuthService.getUsers(req.applicationId, req.startRow, req.numberOfResults);
        const response: UsersResponse = new UsersResponse().init(uuidv4());
        if(users!=null){
          response.responseCode = ResponseCode.OK;
          response.params.status = ResponseStatus.success;
          response.result = {total, users}
        }else{
          response.responseCode = ResponseCode.FAILURE;
          response.params.status = ResponseStatus.failure;
          response.params.errMsg = "No users found"
          response.params.err = "NO_USERS_FOUND"
        }
        return response;
      }

      async fetchUsersByString(queryString: string, startRow: number, numberOfResults: number): Promise<UsersResponse> {
        const {
          total,
          users,
        }: { total: number; users: Array<User> } =
          await this.fusionAuthService.getUsersByString(queryString, startRow, numberOfResults);
        const response: UsersResponse = new UsersResponse().init(uuidv4());
        console.log(response)
        if(users!=null){
          response.responseCode = ResponseCode.OK;
          response.params.status = ResponseStatus.success;
          response.result = {total, users}
        }else{
          response.responseCode = ResponseCode.FAILURE;
          response.params.status = ResponseStatus.failure;
          response.params.errMsg = "No users found"
          response.params.err = "NO_USERS_FOUND"
        }
        return response;
      }
    
      async updatePassword(data: any): Promise<any> {
        return this.httpService.post(process.env.FUSIONAUTH_BASE_URL+'/api/user/change-password', {
            loginId: data.loginId,
            password: data.password
        }, {headers: {
            'Authorization': process.env.FUSIONAUTH_API_KEY,
            'Content-Type': 'application/json'
        }}).pipe(
        map(response => response.status===200?{msg: "Password changed successfully"}:{msg:"Password cannot be changed"}),
        catchError(e=>{
          return e.data;
        })
        );
    }

    async createUser(data: any): Promise<any> {
        const url = process.env.FUSIONAUTH_BASE_URL+'/api/user/registration';
        return this.httpService.post(url, data, {headers: {
            'Authorization': process.env.FUSIONAUTH_API_KEY,
            'Content-Type': 'application/json'
        }}).pipe(
        map(response => response.data),
        catchError(e=>{
          return e.data;
        })
        );
    }

    async updateUser(user_id: string, data: any): Promise<any> {
        const url = process.env.FUSIONAUTH_BASE_URL+`/api/user/${user_id}`
        return this.httpService.patch(url, data, {headers: {
            'Authorization': process.env.FUSIONAUTH_API_KEY,
            'Content-Type': 'application/json'
        }}).pipe(
        map(response => response.data),
        catchError(e=>{
          return e.data;
        })
        );
    }
}
