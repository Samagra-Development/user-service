import { SMS, SMSResponse } from '../sms.interface';

import { Injectable } from '@nestjs/common';
import { SmsService } from '../sms.service';

@Injectable()
export class CdacService extends SmsService implements SMS {
  send(id: any): Promise<SMSResponse> {
    console.log(id);
    throw new Error('Method not implemented.');
  }

  track(id: any): Promise<SMSResponse> {
    console.log(id);
    throw new Error('Method not implemented.');
  }
}
