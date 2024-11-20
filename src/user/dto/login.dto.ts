import { UUID } from '@fusionauth/typescript-client';

export class LoginDto {
  loginId: string;
  password: string;
  applicationId: UUID;
  roles?: Array<string>;
  fingerprint?: string;
  timestamp?: string;
}
