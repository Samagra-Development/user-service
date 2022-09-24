import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiConfig } from "./api.interface";

@Injectable()
export class ConfigResolverService {
    constructor(private configService: ConfigService) {
    }

    transform(applicationId: string): string {
        return applicationId.split("_").join("-");
    }

    getConfigByApplicationId(applicationId: string): ApiConfig {
        applicationId = this.transform(applicationId);
        return this.configService.get<ApiConfig>(applicationId);
    }

    getHost(applicationId: string): string {
        applicationId = this.transform(applicationId);
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).host;
    }

    getApiKey(applicationId: string): string {
        applicationId = this.transform(applicationId);
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).apiKey || null;
    }

    getEncryptionStatus(applicationId: string): boolean {
        applicationId = this.transform(applicationId);
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).encryption.enabled || false;
    }

    getEncryptionKey(applicationId: string): string{
        applicationId = this.transform(applicationId);
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).encryption.key || null;
    }
}