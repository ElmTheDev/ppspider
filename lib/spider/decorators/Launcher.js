"use strict";
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
const FileUtil_1 = require("../../common/util/FileUtil");
const logger_1 = require("../../common/util/logger");
const JobManager_1 = require("../manager/JobManager");
const Default_1 = require("../Default");
const WebServer_1 = require("../ui/WebServer");
const events_1 = require("events");
const QueueManager_1 = require("../manager/QueueManager");
const ArrayUtil_1 = require("../../common/util/ArrayUtil");
const NoneWorkerFactory_1 = require("../worker/NoneWorkerFactory");
const Bean_1 = require("../../common/bean/Bean");
const Job_1 = require("../job/Job");
const MongodbDao_1 = require("../../common/db/MongodbDao");
const NedbDao_1 = require("../../common/db/NedbDao");
const jobConfigs = [];
function addJobConfig(config) {
    jobConfigs.push(config);
}
exports.addJobConfig = addJobConfig;
const requestMappingConfigs = [];
function addRequestMappingConfig(config) {
    requestMappingConfigs.push(config);
}
exports.addRequestMappingConfig = addRequestMappingConfig;
const jobOverrideConfigs = {};
function addJobOverrideConfig(queueName, config) {
    jobOverrideConfigs[queueName] = config;
}
exports.addJobOverrideConfig = addJobOverrideConfig;
const dataUiConfigs = [];
function addDataUiConfig(config) {
    const className = config["className"];
    if (dataUiConfigs.find(item => item["className"] == className)) {
        throw new Error("DataUi(" + className + ") is declared");
    }
    dataUiConfigs.push(config);
}
exports.addDataUiConfig = addDataUiConfig;
const dataUiRequestConfigs = [];
function addDataUiRequestConfig(config) {
    const requestMethod = config.requestMethod;
    if (dataUiRequestConfigs.find(item => item.requestMethod == requestMethod)) {
        let uiTarget;
        findUiTarget: for (let dataUiConfig of dataUiConfigs) {
            const target = dataUiConfig["target"];
            for (let key of Object.getOwnPropertyNames(target.prototype)) {
                const pro = target.prototype[key];
                if (typeof pro === "function" && pro == requestMethod) {
                    uiTarget = target;
                    break findUiTarget;
                }
            }
        }
        throw new Error("DataUiRequest(" + uiTarget.name + ".prototype." + requestMethod.name + ") is handled");
    }
    dataUiRequestConfigs.push(config);
}
exports.addDataUiRequestConfig = addDataUiRequestConfig;
const onEventConfigs = [];
function addOnEventConfig(config) {
    onEventConfigs.push(config);
}
exports.addOnEventConfig = addOnEventConfig;
exports.appInfo = {};
function Launcher(appConfig) {
    Object.assign(exports.appInfo, appConfig);
    FileUtil_1.FileUtil.mkdirs(appConfig.workplace);
    logger_1.logger.setting = appConfig.logger;
    exports.appInfo.eventBus = new events_1.EventEmitter();
    exports.appInfo.eventBus.setMaxListeners(1024);
    for (let onEventConfig of onEventConfigs) {
        exports.appInfo.eventBus.on(onEventConfig.event, (...args) => {
            const target = Bean_1.getBean(onEventConfig.target);
            target[onEventConfig.method].call(target, ...args);
        });
    }
    exports.appInfo.queueCache = exports.appInfo.queueCache || exports.appInfo.workplace + "/queueCache.txt";
    (() => __awaiter(this, void 0, void 0, function* () {
        let shutdownResolve;
        let noneWorkerFactory;
        if (!(noneWorkerFactory = exports.appInfo.workerFactorys.find(item => item.constructor == NoneWorkerFactory_1.NoneWorkerFactory))) {
            noneWorkerFactory = new NoneWorkerFactory_1.NoneWorkerFactory();
            exports.appInfo.workerFactorys.push(noneWorkerFactory);
        }
        dataUiConfigs.forEach(item => {
            item["imported"] = (exports.appInfo.dataUis || []).indexOf(item["target"]) > -1;
        });
        const dataUiRequests = {};
        const dataUiMethodTargets = new Map();
        for (let dataUiConfig of dataUiConfigs) {
            const target = dataUiConfig["target"];
            Bean_1.getBean(target, true);
            if (dataUiConfig["imported"]) {
                for (let key of Object.getOwnPropertyNames(target.prototype)) {
                    const pro = target.prototype[key];
                    if (typeof pro === "function") {
                        dataUiMethodTargets.set(pro, target);
                    }
                }
            }
        }
        for (let dataUiRequestConfig of dataUiRequestConfigs) {
            const requestMethodTarget = dataUiMethodTargets.get(dataUiRequestConfig.requestMethod);
            if (requestMethodTarget) {
                const dataUiConfig = dataUiConfigs.find(item => item["target"] === requestMethodTarget);
                if (dataUiConfig && dataUiConfig["imported"]) {
                    dataUiRequests[requestMethodTarget.name + "." + dataUiRequestConfig.requestMethod.name] = {
                        handlerTarget: dataUiRequestConfig.handleTarget,
                        handlerMethod: dataUiRequestConfig.handleMethod
                    };
                    let requestMethods = dataUiConfig["requestMethods"];
                    if (!requestMethods) {
                        dataUiConfig["requestMethods"] = requestMethods = {};
                    }
                    requestMethods[dataUiRequestConfig.requestMethod.name] = true;
                }
            }
        }
        for (let dataUiConfig of dataUiConfigs) {
            if (dataUiConfig["imported"]) {
                const target = dataUiConfig["target"];
                const targetIns = Bean_1.getBean(target);
                for (let key of Object.getOwnPropertyNames(target.prototype)) {
                    const methodName = key;
                    const pro = target.prototype[methodName];
                    if (typeof pro === "function" && dataUiRequests[target.name + "." + methodName] == null) {
                        targetIns[methodName] = (...args) => {
                            exports.appInfo.webServer.push(target.name, {
                                method: methodName,
                                args: args
                            });
                        };
                    }
                }
            }
        }
        ArrayUtil_1.ArrayUtil.removeIf(jobConfigs, item => exports.appInfo.tasks.indexOf(item["target"]) == -1);
        for (let jobConfig of jobConfigs) {
            const target = jobConfig["target"];
            const method = jobConfig["method"];
            const paramnames = jobConfig["paramnames"];
            const paramtypes = jobConfig["paramtypes"];
            if (paramtypes == null) {
                logger_1.logger.error(new Error(`emitDecoratorMetadata is required, enable it in tsconfig.json:
                {
                    "compilerOptions": {
                        "emitDecoratorMetadata": true
                    }
                }
                then, recompile the ts file`));
                process.exit(-1);
            }
            let hasError = false;
            if (paramtypes.length > 2) {
                hasError = true;
            }
            else {
                let jobParameterN = 0;
                let workerParameterN = 0;
                for (let i = 0, len = paramtypes.length; i < len; i++) {
                    let paramtype = paramtypes[i];
                    if (paramtype == Job_1.Job || Job_1.Job.isPrototypeOf(paramtype)) {
                        jobConfig["jobParamIndex"] = i;
                        jobParameterN++;
                    }
                    else {
                        const workerFactory = exports.appInfo.workerFactorys.find(item => item.workerType() == paramtype);
                        if (workerFactory) {
                            jobConfig["workerFactory"] = workerFactory;
                            jobConfig["workerParamIndex"] = i;
                            workerParameterN++;
                        }
                        else if (paramtype == Object) {
                            logger_1.logger.error(new Error("parameters of " + target.name + "." + method + " is invalid, type of parameter " + paramnames[i] + " should be a class, not an interface."));
                            process.exit(-1);
                        }
                        else {
                            logger_1.logger.error(new Error("parameters of " + target.name + "." + method + " is invalid, WorkerFactory of parameter " + paramnames[i] + " is not found."));
                            process.exit(-1);
                        }
                    }
                }
                if (jobParameterN > 1 || workerParameterN > 1) {
                    hasError = true;
                }
                if (!jobConfig["workerFactory"]) {
                    jobConfig["workerFactory"] = noneWorkerFactory;
                }
            }
            if (hasError) {
                logger_1.logger.error(new Error("parameters of " + target.name + "." + method + " is invalid, at most one (job: Job) parameter and at most one (worker: WorkerType) are required"));
                process.exit(-1);
            }
        }
        jobConfigs.forEach(item => item["target"] = Bean_1.getBean(item["target"], true));
        if (!appConfig.dbUrl) {
            appConfig.dbUrl = "nedb://" + appConfig.workplace + "/nedb";
        }
        logger_1.logger.info("init db(" + appConfig.dbUrl + ") ...");
        if (appConfig.dbUrl.startsWith("nedb://")) {
            exports.appInfo.db = new NedbDao_1.NedbDao(appConfig.dbUrl);
        }
        else if (appConfig.dbUrl.startsWith("mongodb://")) {
            exports.appInfo.db = new MongodbDao_1.MongodbDao(appConfig.dbUrl);
        }
        else {
            throw new Error("not supported db: " + appConfig.dbUrl);
        }
        yield exports.appInfo.db.waitReady();
        logger_1.logger.info("init db(" + appConfig.dbUrl + ") successfully");
        exports.appInfo.jobManager = new JobManager_1.JobManager();
        logger_1.logger.info("init QueueManager ...");
        exports.appInfo.queueManager = new QueueManager_1.QueueManager({
            jobOverrideConfigs: jobOverrideConfigs,
            jobConfigs: jobConfigs
        });
        yield exports.appInfo.queueManager.loadFromCache();
        logger_1.logger.info("init QueueManager successfully");
        exports.appInfo.queueManager.startDispatchLoop();
        class WebRequestHandler {
            static getQueueInfo(request) {
                return {
                    success: true,
                    data: exports.appInfo.queueManager.info()
                };
            }
            static saveQueueCache(request) {
                return exports.appInfo.queueManager.saveQueueCache();
            }
            static deleteQueueCache(request) {
                return exports.appInfo.queueManager.deleteQueueCache();
            }
            static reExecuteOnStartJob(request) {
                return exports.appInfo.queueManager.reExecuteOnStartJob(request.data);
            }
            static setQueueRunning(request) {
                return exports.appInfo.queueManager.setQueueRunning(request.data.queue, request.data.running);
            }
            static updateQueueConfig(request) {
                return exports.appInfo.queueManager.updateConfig(request.data);
            }
            static resetQueueManagerPause(request) {
                exports.appInfo.queueManager.setPause(request.data);
                return true;
            }
            static stopSystem(request) {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    yield exports.appInfo.queueManager.waitRunning();
                    if (request.data.saveQueueCache) {
                        yield exports.appInfo.queueManager.saveQueueCache();
                    }
                    setTimeout(() => shutdownResolve(), 1000);
                    resolve();
                }));
            }
            static jobs(request) {
                return exports.appInfo.jobManager.jobs(request.data);
            }
            static deleteJobs(request) {
                return exports.appInfo.jobManager.deleteJobs(request.data);
            }
            static jobDetail(request) {
                return exports.appInfo.jobManager.jobDetail(request.data);
            }
            static reExecuteJob(request) {
                return exports.appInfo.queueManager.reExecuteJob(request.data);
            }
            static interrupteJob(request) {
                return exports.appInfo.queueManager.interrupteJob(request.data);
            }
            static dataUis(req) {
                return dataUiConfigs.filter(item => item["imported"]);
            }
            static dispatch(req) {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    const method = WebRequestHandler[req.key];
                    if (typeof method == "function") {
                        try {
                            const res = yield method.call(WebRequestHandler, req);
                            resolve(res);
                        }
                        catch (e) {
                            logger_1.logger.warn(e);
                            resolve({
                                success: false,
                                message: e.message
                            });
                        }
                    }
                    else {
                        const dataUiRequest = dataUiRequests[req.key];
                        if (dataUiRequest) {
                            const res = yield Bean_1.getBean(dataUiRequest.handlerTarget, true)[dataUiRequest.handlerMethod](...req.data);
                            resolve(res);
                        }
                        else {
                            resolve({
                                success: false,
                                message: "method not found"
                            });
                        }
                    }
                }));
            }
        }
        requestMappingConfigs.forEach(item => item.target = Bean_1.getBean(item.target, true));
        exports.appInfo.webServer = new WebServer_1.WebServer(exports.appInfo.webUiPort || Default_1.Defaults.webUiPort, exports.appInfo.workplace, requestMappingConfigs, WebRequestHandler.dispatch);
        yield new Promise(resolve => shutdownResolve = resolve);
        for (let workerFactory of exports.appInfo.workerFactorys) {
            workerFactory.shutdown();
        }
        exports.appInfo.webServer.shutdown();
        process.exit(0);
    }))();
    return function (target) { };
}
exports.Launcher = Launcher;
//# sourceMappingURL=Launcher.js.map