import { SMSData, SMSProvider, SMSResponse, SMSResponseStatus } from "../sms.interface";
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Injectable } from "@nestjs/common";
import axios from 'axios';

@Injectable()
export class GupshupWhatsappService {

    constructor(
        @InjectRedis() private readonly redis: Redis
    ) {
    }

    async sendWhatsappOTP(smsData: SMSData, countryCode: string): Promise<SMSResponse> {
        const status: SMSResponse = {
            providerResponseCode: null,
            status: SMSResponseStatus.failure,
            messageID: null,
            error: null,
            providerSuccessResponse: null,
            phone: smsData.phone,
            networkResponseCode: null,
            provider: SMSProvider.gupshup
        };

        // Generate 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000);
        try {
            // First opt-in the user
            const optInParams = new URLSearchParams();
            optInParams.append("method", "OPT_IN");
            optInParams.append("format", "text");
            optInParams.append("userid", process.env.GUPSHUP_WHATSAPP_USERID);
            optInParams.append("password", process.env.GUPSHUP_WHATSAPP_PASSWORD);
            optInParams.append("phone_number", `${countryCode}${smsData.phone}`);
            optInParams.append("v", "1.1");
            optInParams.append("auth_scheme", "plain");
            optInParams.append("channel", "WHATSAPP");

            let optinURL = process.env.GUPSHUP_WHATSAPP_BASEURL + '?' + optInParams.toString();

            await axios.get(optinURL, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Then send OTP message
            const otpMessage = process.env.GUPSHUP_WHATSAPP_OTP_TEMPLATE.replace('%otp%',`${otp}`);
            
            const sendOtpParams = new URLSearchParams();
            sendOtpParams.append("method", "SENDMESSAGE");
            sendOtpParams.append("userid", process.env.GUPSHUP_WHATSAPP_USERID);
            sendOtpParams.append("password", process.env.GUPSHUP_WHATSAPP_PASSWORD);
            sendOtpParams.append("send_to", `${countryCode}${smsData.phone}`);
            sendOtpParams.append("v", "1.1");
            sendOtpParams.append("format", "json");
            sendOtpParams.append("msg_type", "TEXT");
            sendOtpParams.append("msg", otpMessage);
            sendOtpParams.append("isTemplate", "true");
            sendOtpParams.append("footer", process.env.GUPSHUP_WHATSAPP_OTP_TEMPLATE_FOOTER);

            let sendOtpURL = process.env.GUPSHUP_WHATSAPP_BASEURL + '?' + sendOtpParams.toString();

            const response = await axios.get(sendOtpURL, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                // Store OTP in Redis with 30 minute expiry
                await this.redis.set(`whatsapp_otp:${smsData.phone}`, otp.toString(), 'EX', 1800);
                
                status.providerSuccessResponse = JSON.stringify(response.data);
                status.status = SMSResponseStatus.success;
            }

            return status;

        } catch (error) {
            status.error = {
                errorCode: error.code || 'WHATSAPP_ERROR',
                errorText: error.message
            };
            return status;
        }
    }

    async verifyWhatsappOTP(phone: string, otp: string): Promise<SMSResponse> {
        const status: SMSResponse = {
            providerResponseCode: null,
            status: SMSResponseStatus.failure,
            messageID: null,
            error: null,
            providerSuccessResponse: null,
            phone: phone,
            networkResponseCode: null,
            provider: SMSProvider.gupshup
        };

        try {
            // Get stored OTP from Redis
            const storedOTP = await this.redis.get(`whatsapp_otp:${phone}`);

            if (!storedOTP) {
                status.error = {
                    errorCode: 'OTP_EXPIRED',
                    errorText: 'OTP has expired or does not exist'
                };
                return status;
            }

            if (storedOTP === otp) {
                // OTP matches
                status.status = SMSResponseStatus.success;
                status.providerSuccessResponse = 'OTP verified successfully';
                
                // Delete the OTP from Redis after successful verification
                await this.redis.del(`whatsapp_otp:${phone}`);
            } else {
                status.error = {
                    errorCode: 'INVALID_OTP',
                    errorText: 'Invalid OTP provided'
                };
            }

            return status;

        } catch (error) {
            status.error = {
                errorCode: error.code || 'VERIFICATION_ERROR',
                errorText: error.message
            };
            return status;
        }
    }
}