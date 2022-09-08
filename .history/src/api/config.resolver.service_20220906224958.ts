import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ConfigResolverService {
    constructor(private configService: ConfigService) {
    }

    getConfigByApplicationId(applicationId: string): string {
        return this.configService.get<string>(applicationId);
    }

    getHost(applicationId: string): string {
        const config = this.configService.get<string>(applicationId);
        return JSON.parse(config).host;
    }
}