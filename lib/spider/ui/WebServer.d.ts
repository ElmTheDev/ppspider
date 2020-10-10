import { IdKeyData, RequestMappingConfig } from "../Types";
export declare class WebServer {
    private port;
    private webRoot;
    private http;
    private io;
    constructor(port: number, workplace: string, requestMappingConfigs: RequestMappingConfig[], onRequestCallback: (req: IdKeyData) => any);
    push(key: String, data: any): void;
    shutdown(): void;
}
