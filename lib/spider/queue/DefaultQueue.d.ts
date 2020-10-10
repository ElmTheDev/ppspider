import { AbsQueue } from "./AbsQueue";
import { Job } from "../job/Job";
export declare class DefaultQueue extends AbsQueue {
    private queue;
    isEmpty(): boolean;
    pop(): Job;
    peek(): Job;
    push(job: Job): void;
    size(): number;
}
