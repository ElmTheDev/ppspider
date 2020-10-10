"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
var JobStatus;
(function (JobStatus) {
    JobStatus[JobStatus["Waiting"] = 0] = "Waiting";
    JobStatus[JobStatus["Filtered"] = 1] = "Filtered";
    JobStatus[JobStatus["Running"] = 2] = "Running";
    JobStatus[JobStatus["Success"] = 3] = "Success";
    JobStatus[JobStatus["RetryWaiting"] = 4] = "RetryWaiting";
    JobStatus[JobStatus["Fail"] = 5] = "Fail";
    JobStatus[JobStatus["Closed"] = 6] = "Closed";
})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));
function instanceofJob(obj) {
    return obj instanceof Job;
}
exports.instanceofJob = instanceofJob;
let Job = class Job {
    constructor(urlOrParams) {
        this._id = __1.StringUtil.id();
        this.datas = {};
        this.priority = 0;
        this.depth = 0;
        this.status = JobStatus.Waiting;
        this.tryNum = 0;
        this.createTime = new Date().getTime();
        this.logs = [];
        if (typeof urlOrParams === "string") {
            this.url = urlOrParams;
        }
        else {
            Object.assign(this, urlOrParams);
        }
    }
};
Job = __decorate([
    __1.Serializable(),
    __metadata("design:paramtypes", [Object])
], Job);
exports.Job = Job;
//# sourceMappingURL=Job.js.map