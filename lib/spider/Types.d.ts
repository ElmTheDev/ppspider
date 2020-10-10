/// <reference types="node" />
import { Queue } from "./queue/Queue";
import { Filter } from "./filter/Filter";
import { WorkerFactory } from "./worker/WorkerFactory";
import { Job } from "./job/Job";
import { JobManager } from "./manager/JobManager";
import { EventEmitter } from "events";
import { QueueManager } from "./manager/QueueManager";
import { LoggerSetting } from "../common/util/logger";
import { WebServer } from "./ui/WebServer";
import { DbDao } from "../common/db/DbDao";
export declare type Class_Queue = new () => Queue;
export declare type Class_Filter = new () => Filter;
export declare type Class_WorkerFactory = new () => WorkerFactory<any>;
export declare type ParallelConfig = number | {
    [cron: string]: number;
};
export declare type OnStartConfig = {
    urls: string | string[];
    running?: boolean;
    parallel?: ParallelConfig;
    exeInterval?: number;
    exeIntervalJitter?: number;
    timeout?: number;
    description?: string;
    filterType?: Class_Filter;
    maxTry?: number;
    defaultDatas?: any;
};
export declare type OnTimeConfig = {
    urls: string | string[];
    cron: string;
    running?: boolean;
    parallel?: ParallelConfig;
    exeInterval?: number;
    exeIntervalJitter?: number;
    timeout?: number;
    description?: string;
    maxTry?: number;
    defaultDatas?: any;
};
export declare type FromQueueConfig = {
    name: string;
    running?: boolean;
    parallel?: ParallelConfig;
    exeInterval?: number;
    exeIntervalJitter?: number;
    timeout?: number;
    description?: string;
    maxTry?: number;
    defaultDatas?: any;
};
export declare type JobConfig = OnStartConfig | OnTimeConfig | FromQueueConfig;
export declare type RequestMappingConfig = {
    url: string;
    httpMethod: "" | "GET" | "POST";
    target: any;
    method: string;
};
export declare enum ViewEncapsulation {
    Emulated = 0,
    Native = 1,
    None = 2,
    ShadowDom = 3
}
export declare type DataUiConfig = {
    label?: string;
    template: string;
    style?: string;
    encapsulation?: ViewEncapsulation;
};
export declare type DataUiRequestConfig = {
    requestMethod: (...args: any[]) => any;
    handleTarget: any;
    handleMethod: string;
};
export declare type OnEventConfig = {
    event: string;
    target: any;
    method: string;
};
export declare type AppConfig = {
    workplace: string;
    queueCache?: string;
    dbUrl?: string;
    tasks: any[];
    dataUis?: any[];
    workerFactorys: WorkerFactory<any>[];
    webUiPort?: 9000 | number;
    logger?: LoggerSetting;
};
export interface AppInfo extends AppConfig {
    jobManager: JobManager;
    queueManager: QueueManager;
    webServer: WebServer;
    eventBus: EventEmitter;
    db: DbDao;
}
export declare type IdKeyData = {
    id: string;
    key: string;
    data: any;
};
export declare type CanCastToJob = string | string[] | Job | Job[];
export declare type AddToQueueData = Promise<CanCastToJob | {
    [queueName: string]: CanCastToJob;
}>;
export declare type AddToQueueConfig = {
    name: string;
    queueType?: Class_Queue;
    filterType?: Class_Filter;
};
export declare type AddToQueueInfo = {
    queueName: string;
    jobs: CanCastToJob;
    queueType: Class_Queue;
    filterType: Class_Filter;
    _?: any;
};
export declare type AddToQueueInfos = AddToQueueInfo | AddToQueueInfo[];
export declare type JobOverrideConfig = {
    target: any;
    method: (job: Job) => void;
};
export declare type JobOverrideConfigs = {
    [queueName: string]: JobOverrideConfig;
};
export declare type UpdateQueueConfigData = {
    queue: string;
    field: string;
    value: any;
};
