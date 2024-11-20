import {
    IsNotEmpty, IsString,
  } from 'class-validator';
  
  export class VerifyJWTDto {
    @IsString()
    @IsNotEmpty()
    token: string;
  }
  