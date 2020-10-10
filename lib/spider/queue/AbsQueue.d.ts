import { Queue } from "./Queue";
import { Filter } from "../filter/Filter";
import { Job } from "../job/Job";
import { Class_Filter } from "../Types";
export declare abstract class AbsQueue implements Queue {
    private readonly filters;
    addFilter(filter: Filter): void;
    getFilter(filterType: Class_Filter): Filter;
    getFilters(): Filter[];
    abstract isEmpty(): boolean;
    abstract pop(): Job;
    abstract peek(): Job;
    abstract push(job: Job): any;
    abstract size(): number;
}
