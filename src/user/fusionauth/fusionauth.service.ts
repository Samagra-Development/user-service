import { Injectable } from '@nestjs/common';

@Injectable()
export class FusionauthService {
  verifyUsernamePhoneCombination(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
