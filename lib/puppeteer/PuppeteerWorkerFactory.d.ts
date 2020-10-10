import { LaunchOptions } from "puppeteer-core";
import { WorkerFactory } from "../spider/worker/WorkerFactory";
import { Page } from "./Page";
export declare class PuppeteerWorkerFactory implements WorkerFactory<Page> {
    private browser;
    constructor(launchOptions?: LaunchOptions);
    workerType(): any;
    get(): Promise<Page>;
    static exPage(page: Page): Promise<void>;
    static overrideMultiRequestListenersLogic(page: Page): void;
    release(worker: Page): Promise<void>;
    shutdown(): Promise<void>;
}
