import { Job } from "../job/Job";
export declare class JobManager {
    constructor();
    private autoReleaseLoop;
    save(job: Job, skipInsert?: boolean): Promise<"insert" | "replace">;
    job(_id: any): Promise<Job>;
    jobs(pager: any): Promise<any>;
    deleteJobs(pager: any): Promise<any>;
    jobDetail(data: any): Promise<any>;
    private transformToJob;
    private jobStatus;
}
