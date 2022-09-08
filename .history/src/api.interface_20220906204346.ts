export interface Api {
    host: string;
    apiKey: string;
    encryption: {
        enabled: boolean;
        key: string;
    }
}
