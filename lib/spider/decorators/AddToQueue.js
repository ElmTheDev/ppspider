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
const logger_1 = require("../../common/util/logger");
const __1 = require("../..");
const addToQueueConfigs = new Map();
function getAddToQueueConfig(queueConfigs, queueName) {
    let config = null;
    if (queueName) {
        if (queueConfigs.constructor == Array) {
            for (let queueConfig of queueConfigs) {
                if (queueConfig.name == queueName) {
                    config = queueConfig;
                    break;
                }
                else if (queueName.match(queueConfig.name)) {
                    config = Object.assign({}, queueConfig);
                    config.name = queueName;
                    break;
                }
            }
        }
        else {
            const queueConfig = queueConfigs;
            if (queueConfig.name == queueName) {
                config = queueConfig;
            }
            else if (queueName.match(queueConfig.name)) {
                config = Object.assign({}, queueConfig);
                config.name = queueName;
            }
        }
        if (config == null) {
            logger_1.logger.warn("cannot find a queue with name: " + queueName);
            return null;
        }
    }
    else {
        let queueNum;
        if (queueConfigs.constructor == Array) {
            if ((queueNum = queueConfigs.length) != 1) {
                logger_1.logger.warn(queueNum == 0 ? "no queue to add" :
                    queueNum + " queues provide and cannot decide which to add to");
                return null;
            }
            else {
                config = queueConfigs[0];
            }
        }
        else
            config = queueConfigs;
    }
    return config;
}
function transformResToAddToQueueInfos(method, res) {
    const addToQueueDatas = [];
    const queueConfigs = addToQueueConfigs.get(method);
    if (queueConfigs) {
        if (res.constructor == Object) {
            for (let queueName of Object.keys(res)) {
                const queueConfig = getAddToQueueConfig(queueConfigs, queueName);
                if (queueConfig) {
                    addToQueueDatas.push({
                        queueName: queueConfig.name,
                        jobs: res[queueName],
                        queueType: queueConfig.queueType,
                        filterType: queueConfig.filterType
                    });
                }
            }
        }
        else {
            const queueConfig = getAddToQueueConfig(queueConfigs, null);
            if (queueConfig) {
                addToQueueDatas.push({
                    queueName: queueConfig.name,
                    jobs: res,
                    queueType: queueConfig.queueType,
                    filterType: queueConfig.filterType
                });
            }
        }
    }
    return addToQueueDatas;
}
exports.transformResToAddToQueueInfos = transformResToAddToQueueInfos;
function AddToQueue(queueConfigs) {
    return function (target, key, descriptor) {
        const oriFun = descriptor.value;
        const newFun = descriptor.value = (...args) => __awaiter(this, void 0, void 0, function* () {
            const targetIns = __1.getBean(target.constructor);
            const res = yield oriFun.apply(targetIns, args);
            let job = (args || []).find(item => item && item instanceof __1.Job);
            if (res != null) {
                const addToQueueDatas = transformResToAddToQueueInfos(newFun, res);
                addToQueueDatas.length && (yield __1.appInfo.queueManager.addToQueue(job, addToQueueDatas));
            }
            return res;
        });
        addToQueueConfigs.set(newFun, queueConfigs);
        return descriptor;
    };
}
exports.AddToQueue = AddToQueue;
//# sourceMappingURL=AddToQueue.js.map