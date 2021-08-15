import { Injectable } from '@nestjs/common';

@Injectable()
export class FusionauthService {
  persist(authObj: void): boolean | PromiseLike<boolean> {
    throw new Error('Method not implemented.');
  }
  verifyUsernamePhoneCombination(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
