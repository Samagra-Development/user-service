import {
  IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  loginId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsOptional()
  deliveryType?: string;
}


export class LoginWithUniqueIdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  loginId: string;

  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsOptional()
  @IsUUID()
  botId: string;
}
