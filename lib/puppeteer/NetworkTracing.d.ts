import { Page } from "puppeteer";
export declare type PageRequest = {
    id: string;
    url: string;
    method: string;
    time: number;
    response?: {
        status: number;
        location?: string;
        contentType: string;
        contentLength: number;
        fromCache: boolean;
        fromServiceWorker: boolean;
        time: number;
    };
    endTime: number;
    success: boolean;
};
export declare type PageRequests = {
    time: number;
    requests: PageRequest[];
};
export declare class NetworkTracing {
    private startTime;
    private requestMap;
    private page;
    private onRequest;
    private onResponse;
    private onRequestFinished;
    private onRequestFailed;
    constructor(page: Page);
    requests(): PageRequests;
    static requestsToTraceEvents(pageRequests: PageRequests): {
        traceEvents: any[];
    };
}
