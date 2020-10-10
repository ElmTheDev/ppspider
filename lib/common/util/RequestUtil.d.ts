/// <reference types="node" />
import { CoreOptions, UriOptions, UrlOptions } from "request";
import { IncomingHttpHeaders } from "http";
export declare type SimpleResponse = {
    status: number;
    headers: IncomingHttpHeaders;
    body: Buffer;
};
export declare class RequestUtil {
    static simple(options: (UriOptions | UrlOptions) & CoreOptions & {
        headerLines?: string;
    }, handler?: ((error: Error, res: SimpleResponse) => void)): Promise<SimpleResponse>;
    static linesToHeaders(lines: string): {
        [headerName: string]: string;
    };
}
