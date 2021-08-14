import { UUID } from '@fusionauth/typescript-client';

enum ResponseStatus {
  success = 'Success',
  failure = 'Failure',
}

enum ResponseCode {
  OK = 'OK',
}

enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

export interface ResponseParams {
  responseMsgId: UUID;
  msgId: UUID;
  err: string;
  status: ResponseStatus;
  errMsg: string;
}

export interface GenericResponse {
  id: string;
  ver: string;
  ts: Date;
  params: ResponseParams;
  responseCode: ResponseCode;
}

export interface SignupResult {
  responseMsg: string;
  accountStatus: AccountStatus;
}

export interface SignupResponse extends GenericResponse {
  result: SignupResult;
}
