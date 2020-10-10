import { Job } from "../job/Job";
export interface Filter {
    setExisted(job: Job): any | Promise<any>;
    isExisted(job: Job): boolean | Promise<boolean>;
    clear(): any | Promise<any>;
}
