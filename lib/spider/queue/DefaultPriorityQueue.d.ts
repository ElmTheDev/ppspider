import { AbsQueue } from "./AbsQueue";
import { Job } from "../job/Job";
export declare class DefaultPriorityQueue extends AbsQueue {
    private readonly queue;
    isEmpty(): boolean;
    pop(): Job;
    peek(): Job;
    push(job: Job): void;
    size(): number;
}
