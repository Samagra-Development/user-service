import { Body, Controller, Request, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/auth-jwt.guard';
import { UsersResponse } from './admin.interface';
import { AdminService } from './admin.service';
import { Roles } from './roles.decorator';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
      ) {}

    @Post('/all')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    async fetchUsers(@Request() req, @Body() data: any): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.fetchUsers(data);
        return users;
    }

    @Post('/changePassword')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    async updatePassword(@Body() data: any): Promise<UsersResponse> {
        const status: UsersResponse = await this.adminService.updatePassword(data);
        return status;
    }

    @Post('/createUser')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    async createUser(@Body() data: any): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.createUser(data);
        return users;
    }

    @Patch('/updateUser/:userId')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    async updateUser(@Param('userId') userId: string, @Body() data: any): Promise<UsersResponse> {
        const user: UsersResponse = await this.adminService.updateUser(userId, data);
        return user;
    }

    @Get('/searchUser')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    async searchUser(@Query() query: {queryString: string, startRow: number, numberOfResults: number}): Promise<UsersResponse> {
        console.log(query.numberOfResults)
        const users: UsersResponse = await this.adminService.fetchUsersByString(query.queryString, query.startRow, query.numberOfResults);
        return users;
    }

    @Get('/user/:userId')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    async searchUserbyId(@Param('userId') userId: string): Promise<UsersResponse> {
        const users: UsersResponse = await this.adminService.fetchUsersByString(userId, undefined, undefined);
        return users;
    }
}
