export interface ApiConfig {
    host: string;
    apiKey?: string;
    encryption?: {
        enabled: boolean;
        key?: string;
    }
}
