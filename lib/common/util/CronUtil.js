"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("cron");
class CronUtil {
    static getCronJob(cronStr) {
        let cronJob = this.crons[cronStr];
        if (!cronJob) {
            CronUtil.crons[cronStr] = cronJob = new cron_1.CronJob(cronStr, null, null, true);
        }
        return cronJob;
    }
    static next(cron, num = 10) {
        const cronJob = this.getCronJob(cron);
        const nexts = cronJob.nextDates(num);
        return nexts.map(item => item.toDate());
    }
    static prev(cron, now = new Date().getTime()) {
        const cronTime = this.getCronJob(cron)["cronTime"];
        let lastDiff = 0;
        let diff = 3600000;
        let lastDate;
        let isTimeout = false;
        let timeout = 5000;
        setTimeout(() => isTimeout = true, timeout);
        while (true) {
            if (isTimeout) {
                throw new Error(`Find previous date timeout(${timeout}ms) with cron exp(${cron})`);
            }
            let tempLastDate = cronTime["_getNextDateFrom"](now - diff);
            if (tempLastDate) {
                tempLastDate = tempLastDate.toDate();
                if (tempLastDate.getTime() >= now) {
                    lastDiff = diff;
                    diff *= 2;
                }
                else {
                    lastDate = tempLastDate;
                    if (diff - lastDiff < 1000) {
                        break;
                    }
                    diff = +((diff + lastDiff) / 2).toFixed(0);
                }
            }
            else {
                lastDiff = diff;
                diff *= 2;
            }
        }
        return lastDate;
    }
    static setInterval(cron, func) {
        const cronJob = this.getCronJob(cron);
        cronJob.addCallback(func);
        return {
            cron: cron,
            callback: func,
            clear: () => {
                this.removeInterval(cron, func);
            }
        };
    }
    static removeInterval(cron, func) {
        const cronJob = this.getCronJob(cron);
        const _callbacks = cronJob["_callbacks"];
        if (func) {
            const index = _callbacks.indexOf(func);
            if (index > -1) {
                _callbacks.splice(index, 1);
            }
        }
        else {
            _callbacks.splice(0, _callbacks.length);
        }
        if (_callbacks.length == 0) {
            cronJob.stop();
            delete this.crons[cron];
        }
    }
}
exports.CronUtil = CronUtil;
CronUtil.crons = {};
//# sourceMappingURL=CronUtil.js.map