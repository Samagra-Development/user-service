import {
  OTPResponse,
  SMS,
  SMSData,
  SMSError,
  SMSProvider,
  SMSResponse,
  SMSResponseStatus,
  SMSType,
  TrackStatus,
} from '../sms.interface';

import { Injectable } from '@nestjs/common';
import { SmsService } from '../sms.service';
import got from 'got/dist/source';
import { parse } from 'path/posix';
import { response } from 'express';

@Injectable()
export class GupshupService extends SmsService implements SMS {
  apiConstants: any = {
    format: 'text',
    v: '1.1',
  };

  otpAuthMethod = 'TWO_FACTOR_AUTH';
  getMethod = 'get';
  postMethod = 'get';

  otpApiConstants: any = {
    otpCodeType: 'NUMERIC',
    otpCodeLength: 4,
    ...this.apiConstants,
  };

  auth: any = {
    userid: '',
    password: '',
  };

  baseURL: string;
  path = '';
  data: SMSData;

  constructor(username: string, password: string, baseURL: string) {
    super();
    this.auth.userid = username;
    this.auth.password = password;
    this.baseURL = baseURL;
  }

  send(data: SMSData): Promise<SMSResponse> {
    if (!data) {
      throw new Error('Data cannot be null');
    }
    this.data = data;
    if (this.data.type === SMSType.otp) return this.doOTPRequest(data);
    else return this.doRequest();
  }

  doRequest(): Promise<SMSResponse> {
    throw new Error('Method not implemented.');
  }

  track(arg: any): Promise<TrackStatus> {
    throw new Error('Method not implemented.');
  }

  doOTPRequest(data: SMSData): Promise<OTPResponse> {
    const options = {
      searchParams: {
        ...this.otpApiConstants,
        ...this.auth,
        method: this.otpAuthMethod,
        msg: this.getOTPTemplate(),
        phone_no: data.phone,
      },
    };
    const url = this.baseURL + '' + this.path;
    const status: OTPResponse = {} as OTPResponse;
    status.provider = SMSProvider.gupshup;
    status.phone = data.phone;

    return got
      .get(url, options)
      .then((response): OTPResponse => {
        status.networkResponseCode = 200;
        const r = parseResponse(response.body);
        status.messageID = r.messageID;
        status.error = r.error;
        status.providerResponseCode = r.providerResponseCode;
        status.providerSuccessResponse = r.providerSuccessResponse;
        status.status = r.status;
        return status;
      })
      .catch((e: Error): OTPResponse => {
        const error: SMSError = {
          errorText: `Uncaught Exception :: ${e.message}`,
          errorCode: 'CUSTOM ERROR',
        };
        status.networkResponseCode = 200;
        status.messageID = null;
        status.error = error;
        status.providerResponseCode = null;
        status.providerSuccessResponse = null;
        status.status = SMSResponseStatus.failure;
        return status;
      });
  }

  getOTPTemplate() {
    return process.env.GUPSHUP_OTP_TEMPLATE;
  }
}
function parseResponse(response: string) {
  const responseData: string[] = response.split('|').map((s) => s.trim());
  try {
    if (responseData[0] === 'success') {
      return {
        providerResponseCode: null,
        status: SMSResponseStatus.success,
        messageID: responseData[2],
        error: null,
        providerSuccessResponse: responseData[3],
      };
    } else {
      const error: SMSError = {
        errorText: responseData[2],
        errorCode: responseData[1],
      };
      return {
        providerResponseCode: responseData[1],
        status: SMSResponseStatus.failure,
        messageID: null,
        error,
        providerSuccessResponse: null,
      };
    }
  } catch (e) {
    const error: SMSError = {
      errorText: `Gupshup response could not be parsed :: ${e.message}`,
      errorCode: 'CUSTOM ERROR',
    };
    return {
      providerResponseCode: null,
      status: SMSResponseStatus.failure,
      messageID: null,
      error,
      providerSuccessResponse: null,
    };
  }
}
