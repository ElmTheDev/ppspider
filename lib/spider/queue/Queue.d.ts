import { Job } from "../job/Job";
import { Filter } from "../filter/Filter";
import { Class_Filter } from "../Types";
export interface Queue {
    push(job: Job): any;
    peek(): Job;
    pop(): Job;
    size(): number;
    isEmpty(): boolean;
    getFilter(filterType: Class_Filter): Filter;
    getFilters(): Filter[];
    addFilter(filter: Filter): any;
}
