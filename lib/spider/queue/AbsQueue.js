"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbsQueue {
    constructor() {
        this.filters = {};
    }
    addFilter(filter) {
        this.filters[filter.constructor.name] = filter;
    }
    getFilter(filterType) {
        return this.filters[filterType.name];
    }
    getFilters() {
        const filters = [];
        for (let key of Object.keys(this.filters)) {
            filters.push(this.filters[key]);
        }
        return filters;
    }
}
exports.AbsQueue = AbsQueue;
//# sourceMappingURL=AbsQueue.js.map