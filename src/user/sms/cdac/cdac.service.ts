import { SMS, TrackStatus } from '../sms.interface';

import { Injectable } from '@nestjs/common';
import { SmsService } from '../sms.service';

@Injectable()
export class CdacService extends SmsService implements SMS {
  send(id: any): Promise<any> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  track(id: any): Promise<TrackStatus> {
    console.log(id);
    throw new Error('Method not implemented.');
  }
}
