import { User, UUID } from '@fusionauth/typescript-client';
import { Body, Controller, Request, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/auth-jwt.guard';
import { FusionAuthUserRegistration, SignupResponse, UserRegistration, UsersResponse } from './admin.interface';
import { AdminService } from './admin.service';
import { Roles } from './roles.decorator';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
      ) {}

    @Post('/all')
    @Roles('Admin', 'school')
    @UseGuards(JwtAuthGuard)
    async fetchUsers(@Request() req, @Body() data: any): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.fetchUsers(data);
        return users;
    }

    @Post('/changePassword')
    @Roles('Admin', 'school')
    @UseGuards(JwtAuthGuard)
    async updatePassword(@Body() data: {loginId: string, password: string}): Promise<SignupResponse> {
        const status: SignupResponse = await this.adminService.updatePassword(data);
        return status;
    }

    @Post('/createUser')
    @Roles('Admin', 'school')
    @UseGuards(JwtAuthGuard)
    async createUser(@Body() data: UserRegistration): Promise<SignupResponse> {
        const users: SignupResponse = await this.adminService.createUser(data);
        return users;
    }

    @Patch('/updateUser/:userId')
    @Roles('Admin', 'school')
    @UseGuards(JwtAuthGuard)
    async updateUser(@Param('userId') userId: string, @Body() data: User): Promise<SignupResponse> {
        const user: SignupResponse = await this.adminService.updateUser(userId, data);
        return user;
    }

    @Get('/searchUser')
    @Roles('Admin', 'school')
    @UseGuards(JwtAuthGuard)
    async searchUser(@Query() query: {queryString: string, startRow: number, numberOfResults: number}): Promise<UsersResponse> {
        console.log(query.numberOfResults)
        const users: UsersResponse = await this.adminService.fetchUsersByString(query.queryString, query.startRow, query.numberOfResults);
        return users;
    }

    @Get('/user/:userId')
    @Roles('Admin', 'school')
    @UseGuards(JwtAuthGuard)
    async searchUserbyId(@Param('userId') userId: string): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.fetchUsersByString(userId, undefined, undefined);
        return users;
    }
}
