import { Injectable } from '@nestjs/common';

@Injectable()
export class UserDBService {
  persist(dbObj: any): boolean | PromiseLike<boolean> {
    throw new Error('Method not implemented.');
  }
}
