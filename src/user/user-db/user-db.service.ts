import got, { Response } from 'got/dist/source';

import { Injectable } from '@nestjs/common';

@Injectable()
export class UserDBService {
  url = process.env.ESAMWAD_BACKEND_BASE_URL;
  teacherPartUrl = process.env.ES_TEACHER_PART;

  persist(dbObj: any): Promise<boolean> {
    console.log(dbObj);
    return got
      .post(this.url + this.teacherPartUrl, { json: dbObj })
      .then((response: Response): boolean => {
        return response.statusCode === 201;
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
  }
}
