import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiConfig } from "./api.interface";

@Injectable()
export class ConfigResolverService {
    constructor(private configService: ConfigService) {
    }

    getConfigByApplicationId(applicationId: string): ApiConfig {
        return this.configService.get<ApiConfig>(applicationId);
    }

    getHost(applicationId: string): string {
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).host;
    }

    getApiKey(applicationId: string): string {
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).apiKey || null;
    }

    getEncryptionStatus(applicationId: string): boolean {
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).encryption.enabled || false;
    }

    getEncryptionKey(applicationId: string): string{
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).encryption.key || null;
    }
}