import { Frame, Page, Request, Response, SetCookie } from "puppeteer-core";
import { EasingFunctions } from "../common/util/Paths";
export declare type ResponseListener = (response: Response) => any;
export declare enum DownloadImgError {
    Timeout = "Timeout",
    ImgNotFound = "ImgNotFound",
    DownloadFail = "DownloadFail",
    MkdirsFail = "MkdirsFail",
    WriteFileFail = "WriteFileFail"
}
export declare type FireInfo = {
    max: number;
    cur: number;
};
export declare type DownloadImgResult = {
    success: boolean;
    cost: number;
    src?: string;
    size?: number;
    savePath?: string;
    error?: DownloadImgError;
    status?: number;
};
export declare type ResponseCheckUrlResult = {
    url: string | RegExp;
    fireInfo: FireInfo;
    timeout: number;
    isTimeout: boolean;
    error?: Error;
};
export declare type Selector = string;
export declare type Href = string;
export declare type HrefRegex = string | RegExp;
export declare type ElementTransformer = (ele: Element) => Href | void;
export declare type LinkPredict = HrefRegex | ElementTransformer | [Selector, HrefRegex | ElementTransformer];
export declare type LinkPredictMap = {
    [groupName: string]: LinkPredict;
};
export declare class PuppeteerUtil {
    static defaultViewPort(page: Page): Promise<void>;
    static addJquery(page: Page | Frame, url?: string, savePath?: string): Promise<void>;
    static jsonp(jsonp: string): any;
    static setImgLoad(page: Page, enable: boolean): Promise<void>;
    private static initResponseListener;
    private static addResponseCheckUrlInfo;
    static onResponse(page: Page, url: string | RegExp, listener: ResponseListener, fireMax?: number, timeout?: number): Promise<ResponseCheckUrlResult>;
    static onceResponse(page: Page, url: string | RegExp, listener: ResponseListener, timeout?: number): Promise<ResponseCheckUrlResult>;
    private static removeResponseListener;
    static downloadImg(page: Page | Frame, selectorOrSrc: string, saveDir: string, timeout?: number): Promise<DownloadImgResult>;
    static links(page: Page | Frame, predicts: LinkPredictMap, onlyAddToFirstMatch?: boolean): Promise<{}>;
    static count(page: Page | Frame, selector: string): Promise<number>;
    static specifyIdByJquery(page: Page | Frame, selector: string): Promise<string[]>;
    static scrollToBottom(page: Page | Frame, scrollTimeout?: number, scrollInterval?: number, scrollYDelta?: number): Promise<boolean>;
    static parseCookies(cookiesStr: string): SetCookie[];
    static useProxy(page: Page, proxy: string, enableCache?: boolean): Promise<void>;
    static triggerAndWaitRequest(page: Page, trigger: () => any, predict: (url: string) => any, timeout?: number, printReqUrlLog?: boolean): Promise<Request>;
    static triggerAndWaitResponse(page: Page, trigger: () => any, predict: (url: string) => any, timeout?: number, printResUrlLog?: boolean): Promise<Response>;
    private static getIFramePage;
    private static getIFramePageAndPos;
    static drag(page: Page, from: number[], to: number[], duration?: number, steps?: number, easing?: keyof EasingFunctions): Promise<void>;
    static dragBar(page: Page | Frame, barSelector: string, wrapperSelector: string): Promise<void>;
    static dragJigsaw(page: Page | Frame, sliderSelector: string, frontSelector: string, backSelector: string, distanceFix?: (computedDis: number) => number): Promise<void>;
}
