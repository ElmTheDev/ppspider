import { Filter } from "./Filter";
import { Job } from "../job/Job";
export declare class NoFilter implements Filter {
    clear(): void;
    isExisted(job: Job): boolean;
    setExisted(job: Job): void;
}
