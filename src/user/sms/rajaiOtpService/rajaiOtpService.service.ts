import {
    OTPResponse,
    SMS,
    SMSData,
    SMSError,
    SMSProvider,
    SMSResponse,
    SMSResponseStatus,
    SMSType,
    TrackResponse,
  } from '../sms.interface';
  
  import { Injectable } from '@nestjs/common';
  import { SmsService } from '../sms.service';
  import { Got } from 'got/dist/source';
import { json } from 'stream/consumers';
  
  @Injectable()
  export class RajaiOtpService extends SmsService implements SMS {
  
    otpApiConstants: any = {
        srvnm: "ChatbotAPIs",
        srvmethodnm: ""
    };
  
    auth: any = {
        usrnm: '',
        psw: '',
    };
  
    httpClient: Got;
  
    baseURL: string;
    path = '';
    data: SMSData;
  
    constructor(username: string, password: string, baseURL: string, got: Got) {
      super();
      this.auth.usrnm = username;
      this.auth.psw = password;
      this.baseURL = baseURL;
      this.httpClient = got;
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
  
    track(data: SMSData): Promise<SMSResponse> {
      if (!data) {
        throw new Error('Data cannot be null');
      }
      this.data = data;
      if (this.data.type === SMSType.otp) return this.verifyOTP(data);
      else return this.doRequest();
    }
  
    private doOTPRequest(data: SMSData): Promise<OTPResponse> {
      this.otpApiConstants.srvmethodnm = 'ChatBotGenerateOtpMobile'
      const body: any = {
        obj: {
            ...this.otpApiConstants,
             ...this.auth,
            mobileNo: data.phone,
          }
      }
      const options = {
          headers: {
            'Content-Type': 'application/json'
          },
          json: body
      };
      console.log(options)
      const url = this.baseURL + '' + this.path;
      console.log(url)
      const status: OTPResponse = {} as OTPResponse;
      status.provider = SMSProvider.rajai;
      status.phone = data.phone;
  
      return this.httpClient
        .post(url,options)
        .then((response): OTPResponse => {
          status.networkResponseCode = 200;
          const r = this.parseResponse(response.body);
          console.log("otp response", r);
          status.messageID = r.messageID;
          status.error = r.error;
          status.providerResponseCode = r.providerResponseCode;
          status.providerSuccessResponse = r.providerSuccessResponse;
          status.status = r.status;
          return status;
        })
        .catch((e: Error): OTPResponse => {
          console.log("otp response error", e);
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
  
    verifyOTP(data: SMSData): Promise<TrackResponse> {
      this.otpApiConstants.srvmethodnm = 'ChatBotVerifyOtpMobile'
      console.log({ data });
      const body: any = {
        obj: {
            ...this.otpApiConstants,
             ...this.auth,
            mobileNo: data.phone,
            otp: data.params.otp
          }
      }
      const options = {
        headers: {
          'Content-Type': 'application/json'
        },
        json: body
      };
      const url = this.baseURL + '' + this.path;
      const status: TrackResponse = {} as TrackResponse;
      status.provider = SMSProvider.rajai;
      status.phone = data.phone;
  
      return this.httpClient
        .post(url, options)
        .then((response): OTPResponse => {
          console.log(response.body);
          status.networkResponseCode = 200;
          const r = this.parseResponse(response.body);
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
  
    parseResponse(response: string): any{
      try {
        const responseData = JSON.parse(response);
        if (responseData[0]["status"] === '0' || responseData[0]["message"] === 'OTP Verify Successfully' ) {
          return {
            providerResponseCode: null,
            status: SMSResponseStatus.success,
            messageID: responseData[0]["data"],
            error: null,
            providerSuccessResponse: responseData[0]["message"],
          };
        } else {
          const error: SMSError = {
            errorText: responseData[0]["message"],
            errorCode: responseData[0]["status"],
          };
          return {
            providerResponseCode: responseData[0]["message"],
            status: SMSResponseStatus.failure,
            messageID: null,
            error,
            providerSuccessResponse: null,
          };
        }
      } catch (e) {
        const error: SMSError = {
          errorText: `Gupshup response could not be parsed :: ${e.message}; Provider Response - ${response}`,
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
  }
  