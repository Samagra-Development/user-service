import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersResponse } from './admin.interface';
import { AdminService } from './admin.service';
import { FusionauthService } from './fusionauth/fusionauth.service';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
      ) {}

    @Post('/all')
    @UseGuards(AuthGuard('basic'))
    async fetchUsers(@Body() data: any): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.fetchUsers(data);
        return users;
    }

    @Post('/changePassword')
    @UseGuards(AuthGuard('basic'))
    async updatePassword(@Body() data: any): Promise<UsersResponse> {
        const status: UsersResponse = await this.adminService.updatePassword(data);
        return status;
    }

    @Post('/createUser')
    @UseGuards(AuthGuard('basic'))
    async createUser(@Body() data: any): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.createUser(data);
        return users;
    }

    @Patch('/updateUser/:userId')
    @UseGuards(AuthGuard('basic'))
    async updateUser(@Param('userId') userId: string, @Body() data: any): Promise<UsersResponse> {
        const user: UsersResponse = await this.adminService.updateUser(userId, data);
        return user;
    }

    @Get('/searchUser')
    @UseGuards(AuthGuard('basic'))
    async searchUser(@Query() query: {queryString: string, startRow: number, numberOfResults: number}): Promise<UsersResponse> {
        console.log(query.numberOfResults)
        const users: UsersResponse = await this.adminService.fetchUsersByString(query.queryString, query.startRow, query.numberOfResults);
        return users;
    }

    @Get('/user/:userId')
    @UseGuards(AuthGuard('basic'))
    async searchUserbyId(@Param('userId') userId: string): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.fetchUsersByString(userId, undefined, undefined);
        return users;
    }
}
