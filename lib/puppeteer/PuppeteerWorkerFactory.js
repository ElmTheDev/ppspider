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
const puppeteer_1 = require("puppeteer-core");
const logger_1 = require("../common/util/logger");
const Page_1 = require("./Page");
class PuppeteerWorkerFactory {
    constructor(launchOptions) {
        logger_1.logger.info("init " + PuppeteerWorkerFactory.name + " ...");
        if (launchOptions.args == null) {
            launchOptions.args = [];
        }
        if (launchOptions.args.indexOf("--disable-features=site-per-process") == -1) {
            launchOptions.args.push("--disable-features=site-per-process");
        }
        this.browser = puppeteer_1.launch(launchOptions).then(browser => {
            logger_1.logger.info("init " + PuppeteerWorkerFactory.name + " successfully");
            return browser;
        });
    }
    workerType() {
        return Page_1.Page;
    }
    get() {
        return new Promise(resolve => {
            this.browser.then((browser) => __awaiter(this, void 0, void 0, function* () {
                const page = yield browser.newPage();
                yield PuppeteerWorkerFactory.exPage(page);
                resolve(page);
            }));
        });
    }
    static exPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            const prettyError = (oriError, pageFunction) => {
                const oriStackArr = oriError.stack.split("\n");
                const errPosReg = new RegExp("__puppeteer_evaluation_script__:(\\d+):(\\d+)");
                for (let i = 1, len = oriStackArr.length; i < len; i++) {
                    const errPosM = errPosReg.exec(oriStackArr[i]);
                    if (errPosM) {
                        const rownum = parseInt(errPosM[1]) - 1;
                        const colnum = parseInt(errPosM[2]) - 1;
                        const oriFunLines = pageFunction.toString().split("\n");
                        let oriFunLinesWithErrorPos = "";
                        for (let j = 0, oriFunLinesLen = oriFunLines.length, len = Math.max(oriFunLinesLen, rownum); j <= len; j++) {
                            if (j < oriFunLinesLen) {
                                oriFunLinesWithErrorPos += oriFunLines[j] + "\n";
                            }
                            if (j == rownum) {
                                for (let k = 0; k < colnum; k++) {
                                    oriFunLinesWithErrorPos += "^";
                                }
                                oriFunLinesWithErrorPos += "^\n";
                            }
                        }
                        return new Error(oriError.message + "\n" + oriFunLinesWithErrorPos);
                    }
                }
                return oriError;
            };
            ["$eval", "$$eval"].forEach((funName) => __awaiter(this, void 0, void 0, function* () {
                const oldFun = page[funName];
                page[funName] = (selector, pageFunction, ...args) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return yield oldFun.call(page, selector, pageFunction, ...args);
                    }
                    catch (e) {
                        throw prettyError(e, pageFunction);
                    }
                });
            }));
            ["evaluate", "evaluateOnNewDocument", "evaluateHandle"].forEach((funName) => __awaiter(this, void 0, void 0, function* () {
                const oldFun = page[funName];
                page[funName] = (pageFunction, ...args) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return yield oldFun.call(page, pageFunction, ...args);
                    }
                    catch (e) {
                        throw prettyError(e, pageFunction);
                    }
                });
            }));
            yield page.setViewport({ width: 1920, height: 1080 });
            yield page.evaluateOnNewDocument(() => {
                !window["__awaiter"] && (window["__awaiter"] = function (thisArg, _arguments, P, generator) {
                    return new (P || (P = Promise))(function (resolve, reject) {
                        function fulfilled(value) { try {
                            step(generator.next(value));
                        }
                        catch (e) {
                            reject(e);
                        } }
                        function rejected(value) { try {
                            step(generator["throw"](value));
                        }
                        catch (e) {
                            reject(e);
                        } }
                        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
                        step((generator = generator.apply(thisArg, _arguments || [])).next());
                    });
                });
                Object.defineProperties(navigator, {
                    webdriver: {}
                });
            });
            PuppeteerWorkerFactory.overrideMultiRequestListenersLogic(page);
        });
    }
    static overrideMultiRequestListenersLogic(page) {
        const _requestHandlers = page["_requestHandlers"] = [];
        const theOnlyRequestListener = (request) => __awaiter(this, void 0, void 0, function* () {
            const ps = [];
            for (let i = 0; i < _requestHandlers.length;) {
                let requestHandler = _requestHandlers[i];
                const handler = requestHandler[1] || requestHandler[0];
                ps.push(handler(request));
                requestHandler[1] == null && (i++);
            }
            yield Promise.all(ps);
            if (request["_allowInterception"] && !request["_interceptionHandled"]) {
                yield request.continue();
            }
        });
        const pageOn = page.on;
        const addTheOnlyRequestListener = () => {
            pageOn.call(page, "request", theOnlyRequestListener);
        };
        addTheOnlyRequestListener();
        ["addListener", "on", "once", "prependListener", "prependOnceListener"].forEach(funName => {
            const oldFun = page[funName];
            page[funName] = (eventName, handler) => {
                if (eventName == "request") {
                    const onceWrapper = funName == "once" || funName == "prependOnceListener" ? (...args) => {
                        const index = _requestHandlers.findIndex(item => item[0] == handler);
                        _requestHandlers.splice(index, 1);
                        return handler(...args);
                    } : null;
                    if (funName.startsWith("prepend")) {
                        _requestHandlers.splice(0, 0, [handler, onceWrapper]);
                    }
                    else {
                        _requestHandlers.push([handler, onceWrapper]);
                    }
                }
                else {
                    oldFun.call(page, eventName, handler);
                }
                return page;
            };
        });
        ["removeListener", "off"].forEach(funName => {
            const oldFun = page[funName];
            page[funName] = (eventName, handler) => {
                if (eventName == "request") {
                    const handlerI = _requestHandlers.findIndex(item => item[0] == handler);
                    if (handlerI > -1) {
                        _requestHandlers.splice(handlerI, 1);
                    }
                }
                else {
                    oldFun.call(page, eventName, handler);
                }
                return page;
            };
        });
        ["removeAllListeners"].forEach(funName => {
            const oldFun = page[funName];
            page[funName] = (eventName) => {
                if (eventName == "request") {
                    _requestHandlers.splice(0, _requestHandlers.length);
                }
                else if (eventName == null) {
                    _requestHandlers.splice(0, _requestHandlers.length);
                    oldFun.call(page);
                    addTheOnlyRequestListener();
                }
                else {
                    oldFun.call(page, eventName);
                }
                return page;
            };
        });
        ["listeners", "rawListeners"].forEach(funName => {
            const oldFun = page[funName];
            page[funName] = (eventName) => {
                if (eventName == "request") {
                    const res = [];
                    const isRaw = funName == "rawListeners";
                    _requestHandlers.forEach(item => {
                        res.push(item[0]);
                        isRaw && res.push(item[1]);
                    });
                    return res;
                }
                else {
                    return oldFun.call(page, eventName);
                }
            };
        });
        ["listenerCount"].forEach(funName => {
            const oldFun = page[funName];
            page[funName] = (eventName) => {
                if (eventName == "request") {
                    return _requestHandlers.length;
                }
                else {
                    return oldFun.call(page, eventName);
                }
            };
        });
    }
    release(worker) {
        return worker.close();
    }
    shutdown() {
        if (!this.browser)
            return;
        return this.browser.then(browser => browser.close());
    }
}
exports.PuppeteerWorkerFactory = PuppeteerWorkerFactory;
//# sourceMappingURL=PuppeteerWorkerFactory.js.map