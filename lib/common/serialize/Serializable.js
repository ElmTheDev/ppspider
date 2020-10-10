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
const fs = require("fs");
const readline = require("readline");
const transientFields = new Map();
const classInfos = new Map();
exports.getClassInfoById = (id) => {
    for (let entry of classInfos) {
        let classInfo = entry[1];
        if (classInfo.id == id) {
            return classInfo;
        }
    }
    return null;
};
exports.getClassInfoByConstructor = (constructor) => {
    return classInfos.get(constructor);
};
const stackPosReg = new RegExp("^at .* \\((.*)\\)$");
function getDecoratorPos() {
    const stack = new Error("test").stack.split("\n");
    const pos = stack[3].trim();
    const stackPosM = stackPosReg.exec(pos);
    return stackPosM ? stackPosM[1] : null;
}
function Serializable(config) {
    const decoratorPos = getDecoratorPos();
    return function (target) {
        if (!config)
            config = {};
        const id = config.classId || target.name;
        let existed = classInfos.get(id);
        if (!existed) {
            existed = {
                id: config.classId || target.name,
                type: target,
                pos: decoratorPos,
                transients: transientFields[target],
            };
            classInfos.set(target, existed);
        }
        else {
            throw new Error("duplicate classId(" + existed.id + ") at: \n" + existed.pos + "\n" + existed.pos);
        }
    };
}
exports.Serializable = Serializable;
function Transient() {
    return function (target, field) {
        const isStatic = target.constructor.name === "Function";
        if (isStatic)
            throw new Error("cannot decorate static field with Transient");
        const type = target.constructor;
        let transients = transientFields[type];
        if (!transients) {
            transientFields[type] = transients = {};
        }
        transients[field] = true;
    };
}
exports.Transient = Transient;
function Assign(target, source) {
    if (source && target && typeof source == "object" && typeof target == "object") {
        const transients = transientFields[target.constructor];
        if (transients) {
            for (let field of Object.keys(source)) {
                if (!transients[field]) {
                    target[field] = source[field];
                }
            }
        }
        else {
            Object.assign(target, source);
        }
    }
}
exports.Assign = Assign;
class SerializableUtil {
    static serializeToFile(obj, file, encoding = "utf-8") {
        return new Promise((resolve, reject) => {
            let writeStream = fs.createWriteStream(file, encoding);
            let serFinish = false;
            let writeNum = 0;
            const checkWriteFinish = () => {
                if (writeNum == 0) {
                    writeStream.close();
                    resolve();
                }
            };
            let buffer = "";
            const bufferMaxLen = 1024;
            const tryFlush = (force = false) => {
                if (buffer.length >= bufferMaxLen || (force && buffer.length > 0)) {
                    writeNum++;
                    writeStream.write(buffer, error => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            writeNum--;
                            if (serFinish) {
                                checkWriteFinish();
                            }
                        }
                    });
                    buffer = "";
                }
            };
            const writer = {
                write: str => {
                    buffer += str;
                    tryFlush();
                }
            };
            this._serialize(obj, writer);
            serFinish = true;
            tryFlush(true);
            checkWriteFinish();
        });
    }
    static serializeToString(obj) {
        let res = "";
        const writer = {
            write: str => {
                res += str;
            }
        };
        this._serialize(obj, writer);
        return res;
    }
    static _serialize(obj, writer) {
        if (this.isSimpleType(obj)) {
            writer.write("g.$=" + JSON.stringify(obj) + ";");
            return;
        }
        const objIdChars = "$ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        const objId = num => {
            let res = "";
            let base = 54;
            while (num > 0) {
                res = objIdChars[num % base] + res;
                num = +(num / base).toFixed(0);
            }
            return res || "$";
        };
        const classes = new Map();
        const addClassNewFunction = objConstructor => {
            let c = classes.get(objConstructor);
            if (c == null) {
                const classInfo = classInfos.get(objConstructor);
                if (classInfo) {
                    const classId = classes.size;
                    c = "g.c" + classId;
                    classes.set(objConstructor, c);
                    writer.write(`g.class${classId} = (getClass(${JSON.stringify(classInfo.id)}) || {}).type;${c} = obj => { if (g.class${classId}) { const ins = new g.class${classId}(); Object.assign(ins, obj); return ins; } return obj;};\n`);
                }
            }
            return c;
        };
        const refs = new Map();
        const addRef = (objIndex, keyOrIndex, refIndex) => {
            let arr = refs.get(refIndex);
            if (!arr) {
                refs.set(refIndex, arr = []);
            }
            arr.push({
                objIndex: objIndex,
                keyOrIndex: keyOrIndex
            });
        };
        const objs = new Map();
        objs.set(obj, { index: 0, symbol: "$" });
        const objsIt = objs.entries();
        let entry;
        while (entry = objsIt.next().value) {
            const obj = entry[0];
            const objIndex = entry[1].index;
            const objSymbol = entry[1].symbol;
            const existedObjRefs = [];
            const objType = typeof obj;
            if (obj instanceof Array) {
                const insArr = new Array(obj.length);
                let isAllRef = true;
                for (let i = 0, len = obj.length; i < len; i++) {
                    const value = obj[i];
                    if (this.isSimpleType(value)) {
                        insArr[i] = value;
                        isAllRef = false;
                    }
                    else {
                        let refObjInfo = objs.get(value);
                        if (refObjInfo == null) {
                            refObjInfo = {
                                index: objs.size,
                                symbol: objId(objs.size)
                            };
                            objs.set(value, refObjInfo);
                        }
                        if (refObjInfo.index <= objIndex) {
                            existedObjRefs.push([i, refObjInfo.symbol]);
                        }
                        else {
                            addRef(objSymbol, i, refObjInfo.symbol);
                        }
                    }
                }
                if (isAllRef) {
                    writer.write(`g.${objSymbol}=new Array(${obj.length});`);
                }
                else {
                    const insObjJson = JSON.stringify(insArr);
                    writer.write(`g.${objSymbol}=` + insObjJson + ";");
                }
            }
            else if (objType == "object") {
                const objConstructor = obj.constructor;
                const newF = addClassNewFunction(objConstructor);
                const transients = transientFields[objConstructor];
                let insObj;
                let insObjs = [];
                let keyNum = 0;
                for (let field in obj) {
                    if (transients && transients[field]) {
                        continue;
                    }
                    const value = obj[field];
                    if (this.isSimpleType(value)) {
                        if (keyNum % 1000 == 0) {
                            insObj = {};
                            insObjs.push(insObj);
                        }
                        insObj[field] = value;
                        keyNum++;
                    }
                    else {
                        let refObjInfo = objs.get(value);
                        if (refObjInfo == null) {
                            refObjInfo = {
                                index: objs.size,
                                symbol: objId(objs.size)
                            };
                            objs.set(value, refObjInfo);
                        }
                        if (refObjInfo.index <= objIndex) {
                            existedObjRefs.push([field, refObjInfo.symbol]);
                        }
                        else {
                            addRef(objSymbol, field, refObjInfo.symbol);
                        }
                    }
                }
                let insObjJson = insObjs.length > 0 ? JSON.stringify(insObjs[0]) : "{}";
                writer.write(`g.${objSymbol}=` + (newF ? newF + "(" + insObjJson + ")" : insObjJson) + ";");
                for (let i = 1, len = insObjs.length; i < len; i++) {
                    insObjJson = JSON.stringify(insObjs[i]);
                    writer.write(`\nObject.assign(g.${objSymbol}, ${insObjJson});`);
                }
            }
            else if (objType == "function") {
                const classInfo = classInfos.get(obj);
                if (classInfo) {
                    writer.write(`g.${objSymbol}=getClass(${JSON.stringify(classInfo.id)});`);
                }
                else {
                    let funStr = obj.toString();
                    if (funStr.startsWith("class ")) {
                        writer.write(`g.${objSymbol}={};`);
                    }
                    else {
                        funStr = funStr.split(/\r?\n/).filter(line => !line.trimLeft().startsWith("//")).join(";");
                        writer.write(`g.${objSymbol}=(${funStr});`);
                    }
                }
            }
            for (let refInfo of existedObjRefs) {
                writer.write(`g.${objSymbol}[${typeof refInfo[0] == "number" ? refInfo[0] : JSON.stringify(refInfo[0])}]=g.${refInfo[1]};`);
            }
            const refsOfThis = refs.get(objSymbol);
            if (refsOfThis) {
                for (let refItem of refsOfThis) {
                    writer.write(`g.${refItem.objIndex}[${typeof refItem.keyOrIndex == "number" ? refItem.keyOrIndex : JSON.stringify(refItem.keyOrIndex)}]=g.${objSymbol};`);
                }
                refs.delete(objSymbol);
            }
            writer.write("\n");
        }
    }
    static isSimpleType(obj) {
        if (obj == null || obj == undefined)
            return true;
        const objType = typeof obj;
        return objType == "string" || objType == "number" || objType == "boolean";
    }
    static deserializeFromString(str) {
        const getClass = id => exports.getClassInfoById(id);
        const g = {};
        eval(str);
        return g.$;
    }
    static deserializeFromFile(file, encoding = "utf-8") {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const getClass = id => exports.getClassInfoById(id);
            const g = {};
            const lineBuffer = [];
            let waitReadFinishResolve;
            const waitReadFinishPromise = new Promise(resolve => waitReadFinishResolve = resolve);
            const evalLines = () => {
                let subLinesStr = lineBuffer.join("\n");
                try {
                    eval(subLinesStr);
                }
                catch (e) {
                    const stacks = e.stack.split("\n");
                    stacks.splice(1, 0, subLinesStr);
                    e.stack = stacks.join("\n");
                    waitReadFinishResolve(e);
                }
                lineBuffer.splice(0, lineBuffer.length);
            };
            const reader = readline.createInterface({
                input: fs.createReadStream(file).setEncoding(encoding)
            });
            reader.on('line', function (line) {
                lineBuffer.push(line);
                lineBuffer.length >= 1000 && evalLines();
            });
            reader.on('close', function (line) {
                lineBuffer.length > 0 && evalLines();
                waitReadFinishResolve();
            });
            waitReadFinishPromise.then(err => {
                if (err) {
                    reader.close();
                    return reject(err);
                }
                resolve(g.$);
            });
        }));
    }
}
exports.SerializableUtil = SerializableUtil;
//# sourceMappingURL=Serializable.js.map