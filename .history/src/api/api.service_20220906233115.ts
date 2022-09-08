import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const CryptoJS = require("crypto-js");
const AES = require("crypto-js/aes");

CryptoJS.lib.WordArray.words;

@Injectable()
export class ApiService {
    private encodedBase64Key = process.env.ENCRYPTION_KEY;
    private parsedBase64Key = ((this.encodedBase64Key === undefined) ? "bla" : CryptoJS.enc.Base64.parse(this.encodedBase64Key));
    constructor(private configService: ConfigService) {
        this.encodedBase64Key = this.configService.get<string>('ENCRYPTION_KEY'););
        this.parsedBase64Key = ((this.encodedBase64Key === undefined) ? "bla" : CryptoJS.enc.Base64.parse(this.encodedBase64Key));
    }

    encrypt(plainString: any): any {
        const encryptedString = AES.encrypt(plainString, this.parsedBase64Key, {
          mode: CryptoJS.mode.ECB,
        }).toString();
        return encryptedString;
      };
    
      decrypt(encryptedString: any): any {
        const plainString = AES.decrypt(encryptedString, this.parsedBase64Key, {
          mode: CryptoJS.mode.ECB,
        }).toString(CryptoJS.enc.Utf8);
        return plainString;
      };
}
