import { Filter } from "./Filter";
import { Job } from "../job/Job";
export declare class BloonFilter implements Filter {
    private static readonly size;
    private static readonly seeds;
    private bitSet;
    private emptyExisted;
    clear(): void;
    isExisted(job: Job): boolean;
    setExisted(job: Job): void;
    private static hash;
}
