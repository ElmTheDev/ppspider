"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
function idStr(id) {
    return typeof id === "string" ? id : id.name;
}
const beanDefinitions = new Map();
function addBeanDefinition(beanDefinition) {
    let id = beanDefinition.id;
    if (id == null) {
        if (beanDefinition.method != null) {
            id = beanDefinition.method;
        }
        else if (beanDefinition.field != null) {
            id = beanDefinition.field;
        }
        else {
            id = beanDefinition.target;
        }
    }
    beanDefinition.id = id;
    const existedBeanDefinition = beanDefinitions.get(id);
    if (existedBeanDefinition) {
        if (existedBeanDefinition.id !== beanDefinition.id
            || existedBeanDefinition.target !== beanDefinition.target
            || existedBeanDefinition.field !== beanDefinition.field
            || existedBeanDefinition.method !== beanDefinition.method) {
            throw new Error("duplicate Bean(" + idStr(id) + ")");
        }
    }
    else {
        beanDefinitions.set(id, beanDefinition);
    }
}
function Bean(id) {
    return function (target, fieldOrMethod, descriptor) {
        if (target.constructor.name === "function") {
            throw new Error("cannot decorate static field/method with Bean");
        }
        if (descriptor) {
            addBeanDefinition({
                id: id,
                target: target.constructor,
                method: fieldOrMethod
            });
            return descriptor;
        }
        else if (fieldOrMethod) {
            addBeanDefinition({
                id: id,
                target: target.constructor,
                field: fieldOrMethod
            });
        }
        else {
            addBeanDefinition({
                id: id,
                target: target
            });
        }
    };
}
exports.Bean = Bean;
const autowiredInfos = new Map();
function addAutowiredInfo(autowiredInfo) {
    let id = autowiredInfo.id;
    if (id == null) {
        autowiredInfo.id = autowiredInfo.field || autowiredInfo.paramName;
    }
    let targetDepends = autowiredInfos.get(autowiredInfo.target);
    if (!targetDepends) {
        targetDepends = [];
        autowiredInfos.set(autowiredInfo.target, targetDepends);
    }
    targetDepends.push(autowiredInfo);
}
function Autowired(id) {
    return function (target, fieldOrMethod, paramIndex) {
        if (target.constructor.name === "function") {
            throw new Error("cannot decorate static field with Autowired");
        }
        else if (fieldOrMethod == null || (target.prototype != null && typeof target.prototype[fieldOrMethod] == "function")) {
            throw new Error("cannot decorate class or method with Autowired");
        }
        if (typeof paramIndex === "number") {
            const methodDesc = target[fieldOrMethod].toString();
            const params = methodDesc.substring(fieldOrMethod.length + 1, methodDesc.indexOf(") {")).split(", ");
            const paramTypes = Reflect.getMetadata('design:paramtypes', target, fieldOrMethod);
            addAutowiredInfo({
                id: id,
                target: target.constructor,
                method: fieldOrMethod,
                paramIndex: paramIndex,
                paramName: params[paramIndex],
                paramType: paramTypes[paramIndex]
            });
        }
        else {
            const fieldType = Reflect.getMetadata('design:type', target, fieldOrMethod);
            addAutowiredInfo({
                id: id,
                target: target.constructor,
                field: fieldOrMethod,
                fieldType: fieldType
            });
        }
    };
}
exports.Autowired = Autowired;
const beans = new Map();
function getBean(id, createBeanDefinitionIfNotExisted = false) {
    let bean = beans.get(id);
    if (bean === undefined) {
        if (beanDefinitions.has(id)) {
            bean = initBean(id);
        }
        else if (createBeanDefinitionIfNotExisted && typeof id === "function") {
            addBeanDefinition({
                id: id,
                target: id
            });
            bean = initBean(id);
        }
        else {
            throw new Error("Bean(" + idStr(id) + ") is not defined");
        }
    }
    return bean;
}
exports.getBean = getBean;
function findBean(id, type) {
    try {
        const beanIns = getBean(id, true);
        if (beanIns) {
            return beanIns;
        }
    }
    catch (e) {
    }
    const beanDefinitionsForType = [];
    for (let entry of beanDefinitions.entries()) {
        const beanDefinition = entry[1];
        if (beanDefinition.target == type && !beanDefinition.field && !beanDefinition.method) {
            beanDefinitionsForType.push(beanDefinition);
        }
    }
    if (beanDefinitionsForType.length == 1) {
        return getBean(beanDefinitionsForType[0].id);
    }
    else if (beanDefinitionsForType.length == 0) {
        throw new Error(`bean definition is not found for type ${type.name}`);
    }
    else {
        throw new Error(`${beanDefinitionsForType.length} bean definitions are found for type ${type.name}`);
    }
}
exports.findBean = findBean;
function initBean(id) {
    let beanDefinition = beanDefinitions.get(id);
    if (beanDefinition.method || beanDefinition.field) {
        let targetIns = null;
        for (let entry of beanDefinitions.entries()) {
            const tempId = entry[0];
            const tempDefinition = entry[1];
            if (id !== tempId
                && tempDefinition.target === beanDefinition.target
                && tempDefinition.method === undefined
                && tempDefinition.field === undefined) {
                targetIns = getBean(tempId);
                break;
            }
        }
        if (targetIns == null) {
            throw new Error(beanDefinition.target.name + " is not decorated with @Bean");
        }
        if (beanDefinition.field) {
            return targetIns[beanDefinition.field];
        }
        else {
            return targetIns[beanDefinition.method]();
        }
    }
    else {
        const ins = new beanDefinition.target();
        beans.set(id, ins);
        let autowiredArr = autowiredInfos.get(beanDefinition.target);
        if (autowiredArr) {
            let methodParamAutowiredMap = {};
            for (let autowiredInfo of autowiredArr) {
                if (autowiredInfo.paramIndex == null) {
                    Object.defineProperty(ins, autowiredInfo.field, {
                        get: () => findBean(autowiredInfo.id, autowiredInfo.fieldType)
                    });
                }
                else {
                    let methodParamAutowired = methodParamAutowiredMap[autowiredInfo.method];
                    if (!methodParamAutowired) {
                        methodParamAutowiredMap[autowiredInfo.method] = methodParamAutowired = [];
                    }
                    while (methodParamAutowired.length <= autowiredInfo.paramIndex) {
                        methodParamAutowired.push(null);
                    }
                    methodParamAutowired[autowiredInfo.paramIndex] = autowiredInfo;
                }
            }
            for (let methodName of Object.keys(methodParamAutowiredMap)) {
                const methodParamAutowire = methodParamAutowiredMap[methodName];
                const oldM = ins[methodName];
                ins[methodName] = (...args) => {
                    if (args == null) {
                        args = [];
                    }
                    const newArgs = new Array(Math.max(args.length, methodParamAutowire.length));
                    for (let i = 0, len = newArgs.length; i < len; i++) {
                        const oldArg = args[i];
                        if (oldArg === undefined) {
                            const paramAutowire = methodParamAutowire[i];
                            if (paramAutowire) {
                                newArgs[i] = findBean(paramAutowire.id, paramAutowire.paramType);
                            }
                        }
                        else {
                            newArgs[i] = oldArg;
                        }
                    }
                    return oldM.call(ins, ...newArgs);
                };
            }
        }
        for (let entry of beanDefinitions.entries()) {
            const tempDefinition = entry[1];
            if (tempDefinition.target === beanDefinition.target) {
                if (tempDefinition.field) {
                    registeBean(tempDefinition.id, ins[tempDefinition.field], null, true);
                    Object.defineProperty(ins, tempDefinition.field, {
                        get: () => getBean(tempDefinition.id),
                        set: value => beans.set(tempDefinition.id, value)
                    });
                }
                else if (tempDefinition.method) {
                    const oldM = ins[tempDefinition.method];
                    let _cachedValue = undefined;
                    ins[tempDefinition.method] = (...args) => {
                        if (_cachedValue === undefined) {
                            _cachedValue = oldM.call(ins, ...args);
                            registeBean(tempDefinition.id, _cachedValue, null, true);
                        }
                        return _cachedValue;
                    };
                }
            }
        }
        if (typeof ins["afterInit"] === "function") {
            ins["afterInit"]();
        }
        return ins;
    }
}
function existBean(id) {
    return beans.has(id);
}
exports.existBean = existBean;
function registeBean(id, ins, beanDefinition, ignoreIfExisted = false) {
    if (!beans.has(id)) {
        if (!beanDefinitions.has(id)) {
            addBeanDefinition(beanDefinition || {
                id: id,
                target: ins.constructor
            });
        }
        beans.set(id, ins);
    }
    else if (!ignoreIfExisted) {
        throw new Error("Bean(" + idStr(id) + ") existed");
    }
}
exports.registeBean = registeBean;
//# sourceMappingURL=Bean.js.map