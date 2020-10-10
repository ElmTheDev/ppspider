import { AddToQueueInfos, JobConfig, JobOverrideConfigs, UpdateQueueConfigData } from "../Types";
import { Job } from "../job/Job";
export declare class QueueManager {
    private readonly queueInfos;
    private successNum;
    private runningNum;
    private failNum;
    private pause;
    private saving;
    private jobOverrideConfigs;
    private targetMethodIndexes;
    private dispatchQueueIndex;
    private lastDelayPushTime;
    private queueParallelNextExeTimes;
    constructor(config?: {
        jobOverrideConfigs: JobOverrideConfigs;
        jobConfigs: JobConfig[];
    });
    setPause(value: boolean): void;
    setQueueRunning(queueNameRegex: string, running: boolean): void;
    waitRunning(): Promise<void>;
    deleteQueueCache(): any;
    reExecuteJob(data: any): Promise<any>;
    interrupteJob(data: any): Promise<any>;
    info(): any;
    private simpleQueueInfos;
    loadFromCache(): Promise<void>;
    saveQueueCache(): Promise<{
        success: boolean;
        message: any;
    }>;
    reExecuteOnStartJob(queueName: string): {
        success: boolean;
        message: string;
    };
    updateConfig(data: UpdateQueueConfigData): any;
    private fixParallelNextExeTime;
    private resetQueueParallel;
    private delayPushInfo;
    private setJobConfigs;
    private addQueueConfig;
    private setJobOverrideConfigs;
    private refreshTargetMethodIndexes;
    private addOnStartConfig;
    private addOnStartJob;
    private addOnTimeConfig;
    private addOnTimeJob;
    private computeNextExeTimeForOnTimeJob;
    private addFromQueueConfig;
    private cloneRegexpNamedFromQueueInfo;
    addToQueue(parent: Job, datas: AddToQueueInfos): Promise<void>;
    private addJobToQueue;
    startDispatchLoop(): void;
    private getFreeParallelIndex;
    private dispatch;
    private executeJob;
}
