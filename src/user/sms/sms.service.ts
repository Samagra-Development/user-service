import { SMS, SMSData, TrackStatus } from './sms.interface';

import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService implements SMS {
  send(data: SMSData): any {
    console.error(data);
    throw new Error('Placeholder:: Method not implemented.');
  }

  track(data: any): Promise<TrackStatus> {
    console.error(data);
    throw new Error('Placeholder:: Method not implemented.');
  }
}
