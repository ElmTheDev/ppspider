export declare enum JobStatus {
    Waiting = 0,
    Filtered = 1,
    Running = 2,
    Success = 3,
    RetryWaiting = 4,
    Fail = 5,
    Closed = 6
}
export declare function instanceofJob(obj: any): boolean;
export declare class Job {
    _id: string;
    parentId: string;
    queue: string;
    readonly url: string;
    key: string;
    datas: any;
    priority: number;
    depth: number;
    status: JobStatus;
    tryNum: number;
    createTime: number;
    logs: string[];
    constructor(urlOrParams: string | Object);
}
