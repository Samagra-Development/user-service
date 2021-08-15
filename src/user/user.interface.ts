import { UUID } from '@fusionauth/typescript-client';
import { v4 as uuidv4 } from 'uuid';

enum ResponseStatus {
  success = 'Success',
  failure = 'Failure',
}

enum ResponseCode {
  OK = 'OK',
  FAILURE = 'FAILURE',
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

export interface IGenericResponse {
  id: string;
  ver: string;
  ts: Date;
  params: ResponseParams;
  responseCode: ResponseCode;

  init(msgId: UUID): any;

  getSuccess(): any;
  getFailure(): any;
}

export interface SignupResult {
  responseMsg: string;
  accountStatus: AccountStatus;
}

export class SignupResponse implements IGenericResponse {
  id: string;
  ver: string;
  ts: Date;
  params: ResponseParams;
  responseCode: ResponseCode;
  result: SignupResult;

  init(msgId: UUID): SignupResponse {
    this.responseCode = ResponseCode.OK;
    this.params = {
      responseMsgId: uuidv4(),
      msgId: msgId,
      err: '',
      status: ResponseStatus.success,
      errMsg: '',
    };
    this.ts = new Date();
    this.id = uuidv4();
    this.result = null;
    return this;
  }

  getSuccess() {
    throw new Error('Method not implemented.');
  }
  getFailure() {
    throw new Error('Method not implemented.');
  }
}
