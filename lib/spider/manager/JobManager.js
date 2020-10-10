"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Job_1 = require("../job/Job");
const ObjectUtil_1 = require("../../common/util/ObjectUtil");
const DateUtil_1 = require("../../common/util/DateUtil");
const logger_1 = require("../../common/util/logger");
const __1 = require("../..");
class JobManager {
    constructor() {
        if (__1.appInfo.db instanceof __1.NedbDao) {
            __1.appInfo.db.collection("job").then(nedb => nedb.persistence.setAutocompactionInterval(600000));
        }
        this.autoReleaseLoop();
    }
    autoReleaseLoop() {
        const autoRelease = () => {
            __1.appInfo.db.remove("job", { status: Job_1.JobStatus.Filtered, createTime: { "$lte": new Date().getTime() - 1000 * 120 } }, true).then(res => {
                setTimeout(autoRelease, 30000);
            });
        };
        autoRelease();
    }
    save(job, skipInsert = false) {
        return __1.appInfo.db.save("job", job, skipInsert);
    }
    job(_id) {
        return __1.appInfo.db.findById("job", _id).then(doc => {
            return new Job_1.Job(doc);
        });
    }
    jobs(pager) {
        return Promise.all([
            new Promise(resolve => {
                if (pager.requires && pager.requires.queues) {
                    __1.appInfo.db.findList("job", {}, { queue: 1 }).then(docs => {
                        const queues = {};
                        docs.forEach(doc => queues[doc.queue] = 1);
                        resolve(Object.keys(queues));
                    });
                }
                else
                    resolve();
            }),
            new Promise(resolve => {
                if (pager.requires && pager.requires.jobs) {
                    const tempPager = new __1.Pager();
                    tempPager.pageSize = pager.pageSize;
                    tempPager.pageIndex = pager.pageIndex;
                    tempPager.match = pager.match;
                    tempPager.sort = {
                        createTime: -1
                    };
                    __1.appInfo.db.page("job", tempPager).then(pagerRes => {
                        resolve(pagerRes);
                    });
                }
                else
                    resolve();
            })
        ]).then(results => {
            let status = null;
            if (pager.requires && pager.requires.status) {
                status = this.jobStatus();
            }
            const pagerRes = results[1] || {};
            return {
                success: true,
                data: {
                    total: pagerRes.total,
                    pageIndex: pagerRes.pageIndex,
                    pageSize: pagerRes.pageSize,
                    jobs: pagerRes.list,
                    queues: results[0],
                    status: status
                }
            };
        }).catch(err => {
            logger_1.logger.errorValid && logger_1.logger.error(err);
            return {
                success: false,
                message: err.message
            };
        });
    }
    deleteJobs(pager) {
        return new Promise(resolve => {
            __1.appInfo.db.remove("job", pager.match, true).then(res => {
                resolve({
                    success: true,
                    message: "delete " + res + " jobs"
                });
            }).catch(err => {
                logger_1.logger.errorValid && logger_1.logger.error(err);
                resolve({
                    success: false,
                    message: err.message
                });
            });
        });
    }
    jobDetail(data) {
        return new Promise(resolve => {
            __1.appInfo.db.findById("job", data._id).then(doc => {
                resolve({
                    success: true,
                    data: doc ? this.transformToJob(doc) : {
                        error: "job not found"
                    }
                });
            }).catch(err => {
                logger_1.logger.errorValid && logger_1.logger.error(err);
                resolve({
                    success: false,
                    message: err.message
                });
            });
        });
    }
    transformToJob(job) {
        const jobForUi = {};
        Object.assign(jobForUi, job);
        jobForUi.status = Job_1.JobStatus[job.status];
        jobForUi["_parentId_justForParentFetch"] = job.parentId;
        return ObjectUtil_1.ObjectUtil.transform(jobForUi, value => {
            if (value.constructor == Number && ("" + value).length == 13) {
                return DateUtil_1.DateUtil.toStr(new Date(value));
            }
            else
                return value;
        });
    }
    jobStatus() {
        return Object.keys(Job_1.JobStatus).map(key => {
            const v = Job_1.JobStatus[key];
            return v.constructor == Number ? {
                key: key,
                value: v
            } : null;
        }).filter(item => item != null);
    }
}
exports.JobManager = JobManager;
//# sourceMappingURL=JobManager.js.map