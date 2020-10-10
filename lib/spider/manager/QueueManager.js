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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Serializable_1 = require("../../common/serialize/Serializable");
const Job_1 = require("../job/Job");
const Launcher_1 = require("../decorators/Launcher");
const logger_1 = require("../../common/util/logger");
const Default_1 = require("../Default");
const Events_1 = require("../Events");
const fs = require("fs");
const CronUtil_1 = require("../../common/util/CronUtil");
const DefaultQueue_1 = require("../queue/DefaultQueue");
const NoFilter_1 = require("../filter/NoFilter");
const BloonFilter_1 = require("../filter/BloonFilter");
const PromiseUtil_1 = require("../../common/util/PromiseUtil");
const ObjectUtil_1 = require("../../common/util/ObjectUtil");
let QueueManager = class QueueManager {
    constructor(config) {
        this.queueInfos = {};
        this.successNum = 0;
        this.runningNum = 0;
        this.failNum = 0;
        this.pause = false;
        this.saving = false;
        this.jobOverrideConfigs = {};
        this.targetMethodIndexes = {};
        this.dispatchQueueIndex = 0;
        this.lastDelayPushTime = 0;
        this.queueParallelNextExeTimes = {};
        if (config) {
            this.setJobOverrideConfigs(config.jobOverrideConfigs);
            this.setJobConfigs(config.jobConfigs);
        }
    }
    setPause(value) {
        this.pause = value;
        this.delayPushInfo();
    }
    setQueueRunning(queueNameRegex, running) {
        for (let queueName of Object.keys(this.queueInfos)) {
            if (queueName.match(queueNameRegex)) {
                const queueConfig = this.queueInfos[queueName];
                if (queueConfig) {
                    queueConfig.config.running = running;
                }
            }
        }
        this.delayPushInfo();
    }
    waitRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            this.pause = true;
            this.delayPushInfo();
            yield PromiseUtil_1.PromiseUtil.wait(() => this.runningNum <= 0, 500, Default_1.Defaults.shutdownTimeout);
            if (this.runningNum > 0) {
                setTimeout(() => {
                    Launcher_1.appInfo.eventBus.emit(Events_1.Events.QueueManager_InterruptJob, null, "system shutdown");
                }, 0);
                yield PromiseUtil_1.PromiseUtil.wait(() => this.runningNum <= 0, 500);
            }
            if (this.runningNum > 0)
                this.failNum += this.runningNum;
            this.runningNum = 0;
            this.delayPushInfo();
        });
    }
    deleteQueueCache() {
        try {
            fs.unlinkSync(Launcher_1.appInfo.queueCache);
        }
        catch (e) {
            return {
                success: false,
                message: e.message
            };
        }
        this.delayPushInfo();
        return {
            success: true,
            message: "Delete queue cache successfully"
        };
    }
    reExecuteJob(data) {
        return new Promise(resolve => {
            Launcher_1.appInfo.jobManager.job(data._id).then(job => {
                const queueInfo = this.queueInfos[job.queue];
                !job.datas._ && (job.datas._ = {});
                if (job.datas._.maxTry < 0 || (!job.datas._.maxTry && queueInfo.config.maxTry < 0)) {
                }
                else {
                    let moreTry = queueInfo.config.maxTry;
                    if (!moreTry || moreTry < 0) {
                        moreTry = Default_1.Defaults.maxTry;
                    }
                    job.datas._.maxTry = job.tryNum + moreTry;
                }
                this.addJobToQueue(job, null, job.queue, this.queueInfos[job.queue].queue, null);
                resolve({
                    success: true,
                    message: "add to queue success"
                });
            }).catch(err => {
                logger_1.logger.errorValid && logger_1.logger.error(err);
                resolve({
                    success: false,
                    message: err.message
                });
            });
        }).then((res) => __awaiter(this, void 0, void 0, function* () {
            res.data = yield Launcher_1.appInfo.jobManager.job(data._id);
            return res;
        }));
    }
    interrupteJob(data) {
        return new Promise(resolve => {
            let interrupted = false;
            PromiseUtil_1.PromiseUtil.wait(() => __awaiter(this, void 0, void 0, function* () {
                if (interrupted) {
                    return true;
                }
                else {
                    const job = yield Launcher_1.appInfo.jobManager.job(data._id);
                    if (job.status != Job_1.JobStatus.Running) {
                        return true;
                    }
                }
            }), 500, 30000).then(() => {
                Launcher_1.appInfo.jobManager.job(data._id).then(job => {
                    resolve({
                        success: interrupted,
                        message: interrupted ? "interrupt job(" + data._id + ") successfully"
                            : "job(" + data._id + ") isn't running",
                        data: job
                    });
                });
                Launcher_1.appInfo.eventBus.removeAllListeners(Events_1.Events.QueueManager_InterruptJobSuccess(data._id));
            });
            Launcher_1.appInfo.eventBus.emit(Events_1.Events.QueueManager_InterruptJob, data._id, "interrupt by user");
            Launcher_1.appInfo.eventBus.once(Events_1.Events.QueueManager_InterruptJobSuccess(data._id), () => {
                interrupted = true;
            });
        });
    }
    info() {
        const res = {
            cacheExist: fs.existsSync(Launcher_1.appInfo.queueCache),
            pause: this.pause,
            saving: this.saving,
            success: this.successNum,
            running: this.runningNum,
            fail: this.failNum,
            queues: [],
            shutdownWaitTimeout: Default_1.Defaults.shutdownTimeout
        };
        for (let queueName in this.queueInfos) {
            const queueInfo = this.queueInfos[queueName];
            if (!queueInfo.config || !queueInfo.queue) {
                continue;
            }
            const taskType = queueInfo.config['type'];
            let queueDetail = {
                name: queueName,
                target: queueInfo.config['target'].constructor.name,
                method: queueInfo.config['method'],
                type: taskType,
                workerFactory: queueInfo.config["workerFactory"].constructor.name,
                running: queueInfo.config.running,
                parallel: queueInfo.config.parallel == null ? Default_1.Defaults.maxParallel : queueInfo.config.parallel,
                exeInterval: queueInfo.config.exeInterval,
                exeIntervalJitter: queueInfo.config.exeIntervalJitter,
                description: queueInfo.config.description,
                curMaxParallel: queueInfo.curMaxParallel || 0,
                curParallel: queueInfo.curParallel || 0,
                success: queueInfo.success || 0,
                fail: queueInfo.fail || 0,
                tryFail: queueInfo.tryFail || 0,
                lastExeTime: queueInfo.lastExeTime,
                timeout: queueInfo.config.timeout,
                maxTry: queueInfo.config.maxTry,
                defaultDatas: queueInfo.config.defaultDatas || {},
            };
            if (taskType == "OnStart") {
                const urls = queueInfo.config['urls'];
                queueDetail.urls = typeof urls == "string" ? [urls] : urls;
            }
            else if (taskType == "OnTime") {
                const urls = queueInfo.config['urls'];
                queueDetail.urls = typeof urls == "string" ? [urls] : urls;
                queueDetail.cron = queueInfo.config['cron'];
                if (queueInfo.queue.size() > 0) {
                    queueDetail.nextExeTime = queueInfo.queue.peek().datas._.exeTime;
                }
            }
            else {
                queueDetail.from = queueInfo.config['name'];
                if (queueInfo.queue) {
                    queueDetail.queue = {
                        type: queueInfo.queue.constructor.name,
                        filters: queueInfo.queue.getFilters().map(item => item.constructor.name).join(", "),
                        size: queueInfo.queue.size()
                    };
                }
            }
            res.queues.push(queueDetail);
        }
        const queueTypes = { OnStart: 0, OnTime: 1, FromQueue: 2 };
        res.queues.sort((item1, item2) => {
            if (item1.target !== item2.target) {
                return item1.target < item2.target ? -1 : 1;
            }
            else if (item1.type != item2.type) {
                return queueTypes[item1.type] - queueTypes[item2.type];
            }
            else {
                const methods = this.targetMethodIndexes[item1.target];
                const delta = (methods[item1.method] || 0) - (methods[item2.method] || 0);
                if (delta != 0) {
                    return delta;
                }
                return item1.name < item2.name ? -1 : 1;
            }
        });
        return res;
    }
    simpleQueueInfos() {
        const queues = {};
        for (let queueName in this.queueInfos) {
            const queueInfo = this.queueInfos[queueName];
            if (!queueInfo.config || !queueInfo.queue) {
                continue;
            }
            const taskType = queueInfo.config['type'];
            queues[queueName] = {
                type: taskType,
                running: queueInfo.curParallel,
                success: queueInfo.success || 0,
                fail: queueInfo.fail || 0,
                tryFail: queueInfo.tryFail || 0,
                remain: queueInfo.queue.size()
            };
        }
        return queues;
    }
    loadFromCache() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (fs.existsSync(Launcher_1.appInfo.queueCache)) {
                    const tempQueueManager = (yield Serializable_1.SerializableUtil.deserializeFromFile(Launcher_1.appInfo.queueCache, "utf-8"));
                    this.successNum = tempQueueManager.successNum;
                    this.runningNum = tempQueueManager.runningNum;
                    this.failNum = tempQueueManager.failNum;
                    const loadedTasks = new Map();
                    for (let queueName of Object.keys(tempQueueManager.queueInfos)) {
                        const queueInfo = tempQueueManager.queueInfos[queueName];
                        let thisQueueInfo = this.queueInfos[queueName];
                        if (!thisQueueInfo) {
                            thisQueueInfo = this.cloneRegexpNamedFromQueueInfo(queueName);
                        }
                        if (thisQueueInfo) {
                            thisQueueInfo.success = queueInfo.success;
                            thisQueueInfo.fail = queueInfo.fail;
                            thisQueueInfo.tryFail = queueInfo.tryFail;
                            thisQueueInfo.curMaxParallel = queueInfo.curMaxParallel;
                            thisQueueInfo.lastExeTime = queueInfo.lastExeTime;
                            thisQueueInfo.config.exeInterval = queueInfo.config.exeInterval;
                            thisQueueInfo.config.exeIntervalJitter = queueInfo.config.exeIntervalJitter;
                            thisQueueInfo.config.timeout = queueInfo.config.timeout;
                            thisQueueInfo.config.maxTry = queueInfo.config.maxTry;
                            thisQueueInfo.config.defaultDatas = queueInfo.config.defaultDatas;
                            this.updateConfig({
                                queue: queueName,
                                field: "parallel",
                                value: queueInfo.config.parallel
                            });
                            const taskType = queueInfo.config["type"];
                            if (taskType == "OnTime") {
                                this.updateConfig({
                                    queue: queueName,
                                    field: "cron",
                                    value: queueInfo.config["cron"]
                                });
                            }
                            else {
                                thisQueueInfo.queue = queueInfo.queue;
                            }
                            const taskIns = thisQueueInfo.config["target"];
                            if (!loadedTasks.get(taskIns)) {
                                loadedTasks.set(taskIns, true);
                                Serializable_1.Assign(taskIns, queueInfo.config["target"]);
                            }
                        }
                    }
                }
            }
            catch (e) {
                logger_1.logger.warn(e.stack);
            }
            for (let queueName in this.queueInfos) {
                const queueInfo = this.queueInfos[queueName];
                if (queueInfo.config["type"] == "OnStart") {
                    this.addOnStartJob(queueInfo.name, queueInfo.config.filterType || BloonFilter_1.BloonFilter);
                }
            }
            this.delayPushInfo();
        });
    }
    saveQueueCache() {
        return __awaiter(this, void 0, void 0, function* () {
            this.saving = true;
            this.delayPushInfo();
            return PromiseUtil_1.PromiseUtil.wait(() => this.runningNum <= 0, 500, -1).then(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield Serializable_1.SerializableUtil.serializeToFile(this, Launcher_1.appInfo.queueCache);
                }
                catch (e) {
                    logger_1.logger.warn(e);
                    return {
                        success: false,
                        message: e.message
                    };
                }
                return {
                    success: true,
                    message: "save queue cache successfully"
                };
            })).then(res => {
                this.saving = false;
                this.delayPushInfo();
                return res;
            });
        });
    }
    reExecuteOnStartJob(queueName) {
        this.addOnStartJob(queueName, NoFilter_1.NoFilter);
        return {
            success: true,
            message: "add job to queue successfully"
        };
    }
    updateConfig(data) {
        const queueInfo = this.queueInfos[data.queue];
        if (!queueInfo)
            return {
                success: false,
                message: "queue not existed: " + data.queue
            };
        if (data.field == "parallel") {
            if (queueInfo.config.parallel != data.value) {
                queueInfo.config.parallel = data.value;
                this.resetQueueParallel(queueInfo);
            }
        }
        else if (data.field == "cron") {
            if (queueInfo.config['cron'] != data.value) {
                queueInfo.config['cron'] = data.value;
                while (!queueInfo.queue.isEmpty()) {
                    const job = queueInfo.queue.pop();
                    job.status = Job_1.JobStatus.Closed;
                    job.logs.push(logger_1.logger.formatWithoutPos("info", "job closed because of cron change"));
                }
            }
        }
        else if (data.field == "exeInterval") {
            const rate = queueInfo.config.exeIntervalJitter / (queueInfo.config.exeInterval || 1);
            queueInfo.config.exeInterval = data.value;
            if (queueInfo.config.exeIntervalJitter > queueInfo.config.exeInterval) {
                queueInfo.config.exeIntervalJitter = queueInfo.config.exeInterval * rate;
            }
            this.fixParallelNextExeTime(queueInfo);
        }
        else if (data.field == "exeIntervalJitter") {
            queueInfo.config.exeIntervalJitter = data.value;
            this.fixParallelNextExeTime(queueInfo);
        }
        else if (data.field == "curMaxParallel") {
            queueInfo.curMaxParallel = data.value;
        }
        else if (data.field == "urls") {
            queueInfo.config.urls = data.value;
        }
        else if (data.field == "timeout") {
            queueInfo.config.timeout = data.value;
        }
        else if (data.field == "maxTry") {
            queueInfo.config.maxTry = data.value;
        }
        else if (data.field == "defaultDatas") {
            queueInfo.config.defaultDatas = data.value;
        }
        this.delayPushInfo();
        return {
            success: true,
            message: "update success: " + data.field
        };
    }
    fixParallelNextExeTime(queueInfo) {
        const maxNexExeTime = new Date().getTime() + queueInfo.config.exeInterval + queueInfo.config.exeIntervalJitter;
        let nextExeTime = this.queueParallelNextExeTimes[queueInfo.name];
        for (let key of Object.keys(nextExeTime)) {
            const time = nextExeTime[key];
            if (time > maxNexExeTime) {
                nextExeTime[key] = maxNexExeTime;
            }
        }
        if (queueInfo.config["type"] == "OnTime" && queueInfo.queue.size() > 0) {
            queueInfo.queue.peek().datas._.exeTime = this.computeNextExeTimeForOnTimeJob(queueInfo);
        }
    }
    resetQueueParallel(queueInfo) {
        if (queueInfo && queueInfo.parallelIntervals) {
            for (let interval of queueInfo.parallelIntervals) {
                interval.clear();
            }
            queueInfo.parallelIntervals = null;
        }
        if (queueInfo && queueInfo.config && queueInfo.config.parallel != null) {
            const parallelType = queueInfo.config.parallel.constructor;
            if (parallelType == Number) {
                queueInfo.curMaxParallel = queueInfo.config.parallel;
            }
            else if (parallelType == Object) {
                queueInfo.parallelIntervals = [];
                for (let cron in queueInfo.config.parallel) {
                    const para = queueInfo.config.parallel[cron];
                    if (typeof para == "number") {
                        const interval = CronUtil_1.CronUtil.setInterval(cron, () => {
                            queueInfo.curMaxParallel = para;
                        });
                        queueInfo.parallelIntervals.push(interval);
                    }
                }
                let nearestDate = null;
                let nearestCronParallel = null;
                const now = new Date().getTime();
                for (let cron in queueInfo.config.parallel) {
                    const para = queueInfo.config.parallel[cron];
                    if (typeof para == "number") {
                        try {
                            const prevDate = CronUtil_1.CronUtil.prev(cron, now);
                            if (nearestDate == null || nearestDate < prevDate) {
                                nearestDate = prevDate;
                                nearestCronParallel = para;
                            }
                        }
                        catch (e) {
                            logger_1.logger.warn(e);
                        }
                    }
                }
                if (nearestCronParallel != null) {
                    queueInfo.curMaxParallel = nearestCronParallel;
                }
            }
        }
        if (queueInfo.curMaxParallel == null) {
            queueInfo.curMaxParallel = Default_1.Defaults.maxParallel;
        }
        else if (queueInfo.config && typeof queueInfo.config.parallel == "number"
            && queueInfo.curMaxParallel > queueInfo.config.parallel) {
            queueInfo.curMaxParallel = queueInfo.config.parallel;
        }
    }
    delayPushInfo() {
        if (this.lastDelayPushTime === 0) {
            this.lastDelayPushTime = new Date().getTime();
            setTimeout(() => {
                this.lastDelayPushTime = 0;
                Launcher_1.appInfo.webServer && Launcher_1.appInfo.webServer.push("queues", this.info());
            }, 50);
        }
    }
    setJobConfigs(configs) {
        configs.forEach(config => {
            const type = config["type"];
            if (type == "OnStart") {
                this.addOnStartConfig(config);
            }
            else if (type == "OnTime") {
                this.addOnTimeConfig(config);
            }
            else if (type == "FromQueue") {
                this.addFromQueueConfig(config);
            }
        });
    }
    addQueueConfig(queueName, config) {
        if (!queueName) {
            queueName = config["type"] + "_" + config["target"].constructor.name + "_" + config["method"];
        }
        if (config.running == null) {
            config.running = true;
        }
        if (config.parallel == null) {
            config.parallel = Default_1.Defaults.maxParallel;
        }
        if (config.exeInterval == null) {
            config.exeInterval = Default_1.Defaults.exeInterval;
        }
        if (config.exeIntervalJitter == null) {
            config.exeIntervalJitter = config.exeInterval * Default_1.Defaults.exeIntervalJitterRate;
        }
        if (config.timeout == null) {
            config.timeout = Default_1.Defaults.jobTimeout;
        }
        if (config.maxTry == null) {
            config.maxTry = Default_1.Defaults.maxTry;
        }
        let queueInfo = this.queueInfos[queueName];
        if (!queueInfo) {
            this.queueInfos[queueName] = queueInfo = {
                name: queueName,
                queue: null
            };
        }
        queueInfo.config = config;
        this.resetQueueParallel(queueInfo);
        this.refreshTargetMethodIndexes(queueName);
        return queueName;
    }
    setJobOverrideConfigs(jobOverrideConfigs) {
        Object.assign(this.jobOverrideConfigs, jobOverrideConfigs);
    }
    refreshTargetMethodIndexes(queueName) {
        const queue = this.queueInfos[queueName];
        const target = queue.config['target'];
        const targetName = target.constructor.name;
        let methods;
        if ((methods = this.targetMethodIndexes[targetName]) == null) {
            this.targetMethodIndexes[targetName] = methods = {};
        }
        const methodName = queue.config['method'];
        if (methods[methodName] == null) {
            methods[methodName] = Object.keys(methods).length;
        }
    }
    addOnStartConfig(config) {
        this.addQueueConfig(null, config);
    }
    addOnStartJob(queueName, filterType) {
        const config = this.queueInfos[queueName].config;
        this.addToQueue(null, {
            queueName: queueName,
            jobs: config.urls,
            queueType: DefaultQueue_1.DefaultQueue,
            filterType: filterType
        });
    }
    addOnTimeConfig(config) {
        const queueName = this.addQueueConfig(null, config);
        this.addOnTimeJob(queueName);
    }
    addOnTimeJob(queueName) {
        const queueInfo = this.queueInfos[queueName];
        const nextExeTime = this.computeNextExeTimeForOnTimeJob(queueInfo);
        if (nextExeTime) {
            this.addToQueue(null, {
                queueName: queueName,
                jobs: queueInfo.config.urls,
                queueType: DefaultQueue_1.DefaultQueue,
                filterType: NoFilter_1.NoFilter,
                _: {
                    exeTime: nextExeTime
                }
            });
        }
    }
    computeNextExeTimeForOnTimeJob(queueInfo) {
        let nextExeTime = null;
        const parallelExeInfo = this.queueParallelNextExeTimes[queueInfo.name];
        if (parallelExeInfo) {
            for (let i = 0; i < queueInfo.curMaxParallel; i++) {
                const temp = parallelExeInfo[i];
                if (temp != -1) {
                    if (nextExeTime == null) {
                        const interval = (queueInfo.config.exeInterval || 0)
                            + (Math.random() * 2 - 1) * queueInfo.config.exeIntervalJitter;
                        nextExeTime = new Date().getTime() + interval;
                    }
                    if (nextExeTime == null || nextExeTime > temp) {
                        nextExeTime = temp;
                    }
                }
            }
            if (!nextExeTime) {
                return null;
            }
        }
        const nearTime = +CronUtil_1.CronUtil.next(queueInfo.config.cron, 1)[0].getTime().toFixed(0);
        return nextExeTime == null ? nearTime : Math.max(nearTime, nextExeTime);
    }
    addFromQueueConfig(config) {
        this.addQueueConfig(config.name, config);
    }
    cloneRegexpNamedFromQueueInfo(queueName) {
        for (let key in this.queueInfos) {
            const tempQueueInfo = this.queueInfos[key];
            if (tempQueueInfo.config && tempQueueInfo.config["type"] == "FromQueue" && queueName.match(tempQueueInfo.config["name"])) {
                this.addQueueConfig(queueName, Object.assign({}, tempQueueInfo.config));
                return this.queueInfos[queueName];
            }
        }
    }
    addToQueue(parent, datas) {
        return __awaiter(this, void 0, void 0, function* () {
            if (datas) {
                if (!(datas instanceof Array)) {
                    datas = [datas];
                }
                for (let jobInfo of datas) {
                    const queueName = jobInfo.queueName;
                    let queueInfo = this.queueInfos[queueName];
                    if (!queueInfo) {
                        queueInfo = this.cloneRegexpNamedFromQueueInfo(queueName);
                    }
                    if (!queueInfo || !queueInfo.config) {
                        continue;
                    }
                    let queue = queueInfo.queue;
                    if (!queue) {
                        queueInfo.queue = queue = new (jobInfo.queueType || DefaultQueue_1.DefaultQueue)();
                    }
                    const theFilterType = jobInfo.filterType || BloonFilter_1.BloonFilter;
                    let filter = queue.getFilter(theFilterType);
                    if (!filter) {
                        filter = new theFilterType();
                        queue.addFilter(filter);
                    }
                    const jobs = jobInfo.jobs;
                    if (jobs != null) {
                        if (jobs.constructor == String || Job_1.instanceofJob(jobs)) {
                            yield this.addJobToQueue(jobs, parent, queueName, queue, filter, jobInfo._, this.jobOverrideConfigs[queueName]);
                        }
                        else if (jobs instanceof Array) {
                            for (let job of jobs) {
                                yield this.addJobToQueue(job, parent, queueName, queue, filter, jobInfo._, this.jobOverrideConfigs[queueName]);
                            }
                        }
                    }
                }
            }
        });
    }
    addJobToQueue(jobOrUrl, parent, queueName, queue, filter, _, jobOverrideConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let job = Job_1.instanceofJob(jobOrUrl) ? jobOrUrl : new Job_1.Job(jobOrUrl);
            job.parentId || (job.parentId = "");
            job.datas || (job.datas = {});
            job.depth || (job.depth = 0);
            job.tryNum || (job.tryNum = 0);
            job.status || (job.status = Job_1.JobStatus.Waiting);
            const queueInfo = this.queueInfos[queueName];
            if (queueInfo.config.defaultDatas && Object.keys(queueInfo.config.defaultDatas).length > 0) {
                const mergeDatas = ObjectUtil_1.ObjectUtil.deepClone(queueInfo.config.defaultDatas);
                ObjectUtil_1.ObjectUtil.deepAssign(job.datas, mergeDatas);
                job.datas = mergeDatas;
            }
            if (_) {
                let _sysData = job.datas._;
                if (!_sysData) {
                    job.datas._ = _sysData = {};
                }
                Object.assign(_sysData, _);
            }
            if (!job.queue)
                job.queue = queueName;
            if (parent) {
                if (!job.parentId)
                    job.parentId = parent._id;
                if (job.depth == 0)
                    job.depth = parent.depth + 1;
            }
            if (jobOverrideConfig) {
                yield jobOverrideConfig.method.call(jobOverrideConfig.target, job, parent);
            }
            if (filter && (yield filter.isExisted(job)) == true) {
                job.status = Job_1.JobStatus.Filtered;
                job.logs.push(logger_1.logger.formatWithoutPos("warn", "filtered"));
            }
            else {
                filter && (yield filter.setExisted(job));
                queue.push(job);
                if (job.status != Job_1.JobStatus.RetryWaiting)
                    job.status = Job_1.JobStatus.Waiting;
                job.logs.push(logger_1.logger.formatWithoutPos("info", "add to queue"));
            }
            yield Launcher_1.appInfo.jobManager.save(job);
            this.delayPushInfo();
        });
    }
    startDispatchLoop() {
        const dispatchLoop = () => {
            this.dispatch();
            setTimeout(() => dispatchLoop(), 60);
        };
        dispatchLoop();
    }
    getFreeParallelIndex(queueName, queueInfo, now) {
        let parallelExeInfo = this.queueParallelNextExeTimes[queueName];
        if (!parallelExeInfo) {
            this.queueParallelNextExeTimes[queueName] = parallelExeInfo = {};
        }
        for (let i = 0; i < queueInfo.curMaxParallel; i++) {
            const nextExeTime = parallelExeInfo[i];
            if (nextExeTime != -1 && (nextExeTime == null || nextExeTime <= now)) {
                return i;
            }
        }
        return -1;
    }
    dispatch() {
        if (this.pause || this.saving)
            return;
        const queueNames = Object.keys(this.queueInfos);
        if (queueNames.length == 0)
            return;
        const now = new Date().getTime();
        if (this.dispatchQueueIndex >= queueNames.length) {
            this.dispatchQueueIndex = 0;
        }
        while (this.dispatchQueueIndex < queueNames.length) {
            const queueName = queueNames[this.dispatchQueueIndex];
            const queueInfo = this.queueInfos[queueName];
            if (queueInfo && queueInfo.queue && queueInfo.config) {
                if (queueInfo.queue.isEmpty() && queueInfo.config["type"] == "OnTime") {
                    this.addOnTimeJob(queueName);
                }
                let parallelIndex;
                while (!queueInfo.queue.isEmpty()
                    && (parallelIndex = this.getFreeParallelIndex(queueName, queueInfo, now)) != -1) {
                    const curParallelIndex = parallelIndex;
                    let job = null;
                    if (queueInfo.config["type"] == "OnTime") {
                        job = queueInfo.queue.peek();
                        if (job) {
                            if (job.datas._.exeTime > now)
                                job = null;
                            else {
                                queueInfo.queue.pop();
                                if (!queueInfo.config.running) {
                                    job.status = Job_1.JobStatus.Closed;
                                    job.logs.push(logger_1.logger.formatWithoutPos("warn", "the OnTime queue is not running"));
                                    Launcher_1.appInfo.jobManager.save(job, true);
                                    job = null;
                                }
                            }
                        }
                    }
                    else if (queueInfo.config.running) {
                        job = queueInfo.queue.pop();
                    }
                    if (job) {
                        this.queueParallelNextExeTimes[queueName][curParallelIndex] = -1;
                        this.executeJob(queueInfo, job).then(() => {
                            const interval = (queueInfo.config.exeInterval || 0)
                                + (Math.random() * 2 - 1) * queueInfo.config.exeIntervalJitter;
                            this.queueParallelNextExeTimes[queueName][curParallelIndex] = new Date().getTime() + interval;
                        }).then(() => {
                            Launcher_1.appInfo.eventBus.emit(Events_1.Events.QueueManager_JobExecuted, {
                                job: job,
                                queues: this.simpleQueueInfos()
                            });
                        });
                    }
                    else
                        break;
                }
            }
            this.dispatchQueueIndex++;
        }
    }
    executeJob(queueInfo, job) {
        queueInfo.curParallel = (queueInfo.curParallel || 0) + 1;
        queueInfo.lastExeTime = new Date().getTime();
        const target = queueInfo.config["target"];
        const method = target[queueInfo.config["method"]];
        const workerFactory = queueInfo.config["workerFactory"];
        return workerFactory.get().then((worker) => __awaiter(this, void 0, void 0, function* () {
            this.runningNum++;
            this.delayPushInfo();
            job.logs.push(logger_1.logger.formatWithoutPos("info", "start execution"));
            job.status = Job_1.JobStatus.Running;
            job.tryNum++;
            yield Launcher_1.appInfo.jobManager.save(job, true);
            let interrupted = false;
            try {
                let listenInterrupt = null;
                yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    if (queueInfo.config.timeout == null || queueInfo.config.timeout >= 0) {
                        const timeout = queueInfo.config.timeout || Default_1.Defaults.jobTimeout;
                        setTimeout(() => {
                            reject(new Error("job timeout in " + timeout + "ms"));
                        }, timeout);
                    }
                    listenInterrupt = (jobId, reason) => {
                        if (jobId == null || jobId == job._id) {
                            interrupted = true;
                            reject(new Error(Events_1.Events.QueueManager_InterruptJob + ": " + reason));
                            if (jobId) {
                                setTimeout(() => {
                                    Launcher_1.appInfo.eventBus.emit(Events_1.Events.QueueManager_InterruptJobSuccess(jobId));
                                }, 0);
                            }
                        }
                    };
                    Launcher_1.appInfo.eventBus.on(Events_1.Events.QueueManager_InterruptJob, listenInterrupt);
                    try {
                        const paramArr = [];
                        const workerParamIndex = queueInfo.config["workerParamIndex"];
                        (workerParamIndex == 0 || workerParamIndex == 1) && (paramArr[workerParamIndex] = worker);
                        const jobParamIndex = queueInfo.config["jobParamIndex"];
                        if (jobParamIndex == 0 || jobParamIndex == 1) {
                            paramArr[jobParamIndex] = job;
                        }
                        else {
                            paramArr.push(job);
                        }
                        const res = yield method.call(target, ...paramArr);
                        resolve(res);
                    }
                    catch (e) {
                        reject(e);
                    }
                })).finally(() => {
                    listenInterrupt && Launcher_1.appInfo.eventBus.removeListener(Events_1.Events.QueueManager_InterruptJob, listenInterrupt);
                });
                job.status = Job_1.JobStatus.Success;
                job.logs.push(logger_1.logger.formatWithoutPos("info", "executed successfully"));
                this.successNum++;
            }
            catch (e) {
                let maxTry = (job.datas._ || {}).maxTry;
                if (!maxTry) {
                    if (queueInfo.config.maxTry) {
                        maxTry = queueInfo.config.maxTry;
                    }
                    else {
                        maxTry = Default_1.Defaults.maxTry;
                    }
                }
                if (interrupted || (maxTry >= 0 && job.tryNum >= maxTry)) {
                    job.status = Job_1.JobStatus.Fail;
                    this.failNum++;
                    queueInfo.fail = (queueInfo.fail || 0) + 1;
                }
                else {
                    job.status = Job_1.JobStatus.RetryWaiting;
                }
                job.logs.push(logger_1.logger.formatWithoutPos("error", e));
                logger_1.logger.error(job, e);
            }
            this.runningNum--;
            queueInfo.curParallel--;
            if (job.status == Job_1.JobStatus.Success) {
                queueInfo.success = (queueInfo.success || 0) + 1;
            }
            else {
                queueInfo.tryFail = (queueInfo.tryFail || 0) + 1;
            }
            if (job.status == Job_1.JobStatus.RetryWaiting) {
                yield this.addJobToQueue(job, null, job.queue, queueInfo.queue, null);
            }
            else {
                yield Launcher_1.appInfo.jobManager.save(job, true);
            }
            this.delayPushInfo();
            yield workerFactory.release(worker);
        }));
    }
};
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "pause", void 0);
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "saving", void 0);
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "jobOverrideConfigs", void 0);
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "targetMethodIndexes", void 0);
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "dispatchQueueIndex", void 0);
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "lastDelayPushTime", void 0);
__decorate([
    Serializable_1.Transient(),
    __metadata("design:type", Object)
], QueueManager.prototype, "queueParallelNextExeTimes", void 0);
QueueManager = __decorate([
    Serializable_1.Serializable(),
    __metadata("design:paramtypes", [Object])
], QueueManager);
exports.QueueManager = QueueManager;
//# sourceMappingURL=QueueManager.js.map