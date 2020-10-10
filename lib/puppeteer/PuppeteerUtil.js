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
const os = require("os");
const fs = require("fs");
const DownloadUtil_1 = require("../common/util/DownloadUtil");
const logger_1 = require("../common/util/logger");
const FileUtil_1 = require("../common/util/FileUtil");
const RequestUtil_1 = require("../common/util/RequestUtil");
const __1 = require("..");
const url = require("url");
const Paths_1 = require("../common/util/Paths");
const path = require("path");
var DownloadImgError;
(function (DownloadImgError) {
    DownloadImgError["Timeout"] = "Timeout";
    DownloadImgError["ImgNotFound"] = "ImgNotFound";
    DownloadImgError["DownloadFail"] = "DownloadFail";
    DownloadImgError["MkdirsFail"] = "MkdirsFail";
    DownloadImgError["WriteFileFail"] = "WriteFileFail";
})(DownloadImgError = exports.DownloadImgError || (exports.DownloadImgError = {}));
const kRequestInterception_ImgLoad = "_requestListener_imgLoad";
const kResponseCheckUrls = "_responseCheckUrls";
const kResponseListener = "_responseListener";
const onePxBuffer = [82, 73, 70, 70, 74, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88, 10, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 76, 80, 72, 12, 0, 0, 0, 1, 7, 16, 17, 253, 15, 68, 68, 255, 3, 0, 0, 86, 80, 56, 32, 24, 0, 0, 0, 48, 1, 0, 157, 1, 42, 1, 0, 1, 0, 3, 0, 52, 37, 164, 0, 3, 112, 0, 254, 251, 253, 80, 0];
class PuppeteerUtil {
    static defaultViewPort(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.setViewport({
                width: 1920,
                height: 1080
            });
        });
    }
    static addJquery(page, url = "https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js", savePath = os.tmpdir() + "/jquery.min.js") {
        return __awaiter(this, void 0, void 0, function* () {
            const jQueryExisted = yield page.evaluate(() => {
                return typeof jQuery !== "undefined";
            });
            if (!jQueryExisted) {
                yield DownloadUtil_1.DownloadUtil.download(url, savePath).then((res) => __awaiter(this, void 0, void 0, function* () {
                    if (res > 0) {
                        const jQueryStr = fs.readFileSync(savePath, "utf-8");
                        yield page.evaluate(jQueryStr => {
                            eval(jQueryStr);
                        }, jQueryStr);
                    }
                }));
            }
        });
    }
    static jsonp(jsonp) {
        let index;
        if (jsonp == null || (index = jsonp.indexOf('(')) == -1)
            return {};
        try {
            const callbackName = jsonp.substring(0, index);
            const evalStr = `function ${callbackName}(arg) { return arg; }\n${jsonp}`;
            return eval(evalStr);
        }
        catch (e) {
            logger_1.logger.warn(e);
            return {};
        }
    }
    static setImgLoad(page, enable) {
        return __awaiter(this, void 0, void 0, function* () {
            if (enable) {
                if (page[kRequestInterception_ImgLoad]) {
                    page.removeListener("request", page[kRequestInterception_ImgLoad]);
                }
            }
            else {
                yield page.setRequestInterception(true);
                if (!page[kRequestInterception_ImgLoad]) {
                    page[kRequestInterception_ImgLoad] = (request) => __awaiter(this, void 0, void 0, function* () {
                        if (!request["_interceptionHandled"] && request["_allowInterception"]) {
                            const requestUrl = request.url();
                            const resourceType = request.resourceType();
                            if (resourceType === "image") {
                                let responseCheckUrls = page[kResponseCheckUrls] || [];
                                if (responseCheckUrls.find(item => {
                                    let checkUrl = item.url;
                                    if (typeof item.url == "string") {
                                        if (checkUrl.startsWith("//")) {
                                            checkUrl = requestUrl.split("//")[0] + checkUrl;
                                        }
                                    }
                                    return requestUrl.match(checkUrl) != null || checkUrl == requestUrl;
                                })) {
                                }
                                else {
                                    yield request.respond({
                                        status: 200,
                                        contentType: "image/webp",
                                        body: Buffer.from(onePxBuffer)
                                    });
                                }
                            }
                            else if (requestUrl.indexOf("://hm.baidu.com/h.js") > -1) {
                                yield request.respond({
                                    status: 200,
                                    contentType: "application/javascript",
                                    body: Buffer.from([])
                                });
                            }
                            else {
                            }
                        }
                    });
                }
                page.on("request", page[kRequestInterception_ImgLoad]);
            }
        });
    }
    static initResponseListener(page) {
        let responseListener = page[kResponseListener];
        if (!responseListener) {
            page[kResponseListener] = responseListener = (response) => __awaiter(this, void 0, void 0, function* () {
                const responseUrl = response.url();
                let responseCheckUrls = page[kResponseCheckUrls] || [];
                const removes = [];
                for (let responseCheckUrl of responseCheckUrls) {
                    let checkUrl = responseCheckUrl.url;
                    if (typeof checkUrl == "string") {
                        if (checkUrl.startsWith("//")) {
                            checkUrl = responseUrl.split("//")[0] + checkUrl;
                        }
                    }
                    if (responseUrl === checkUrl || responseUrl.match(checkUrl)) {
                        try {
                            yield responseCheckUrl.listener(response);
                        }
                        catch (e) {
                            console.warn(e);
                        }
                        responseCheckUrl.fireInfo.cur++;
                        if (responseCheckUrl.fireInfo.max > 0 && responseCheckUrl.fireInfo.cur >= responseCheckUrl.fireInfo.max) {
                            removes.push(responseCheckUrl);
                            responseCheckUrl.resolve({
                                url: responseCheckUrl.url,
                                fireInfo: responseCheckUrl.fireInfo,
                                timeout: responseCheckUrl.timeout,
                                isTimeout: false
                            });
                        }
                    }
                }
                for (let remove of removes) {
                    responseCheckUrls.splice(responseCheckUrls.indexOf(remove), 1);
                }
            });
            page.on("response", responseListener);
        }
    }
    static addResponseCheckUrlInfo(page, responseCheckUrlInfo) {
        if (page == null || responseCheckUrlInfo == null)
            return;
        let responseCheckUrls = page[kResponseCheckUrls];
        if (!responseCheckUrls) {
            page[kResponseCheckUrls] = responseCheckUrls = [];
        }
        responseCheckUrls.push(responseCheckUrlInfo);
        this.initResponseListener(page);
    }
    static onResponse(page, url, listener, fireMax = -1, timeout = 30000) {
        fireMax = parseInt("" + fireMax);
        return new Promise(resolve => {
            const fireInfo = {
                max: fireMax,
                cur: 0
            };
            const responseCheckUrl = {
                url: url,
                listener: listener,
                resolve: resolve,
                fireInfo: fireInfo,
                timeout: timeout
            };
            const responseCheckUrlRes = {
                url: url,
                fireInfo: fireInfo,
                timeout: timeout,
                isTimeout: false
            };
            try {
                this.addResponseCheckUrlInfo(page, responseCheckUrl);
                if (fireMax > 0) {
                    setTimeout(() => {
                        responseCheckUrlRes.isTimeout = true;
                        resolve(responseCheckUrlRes);
                    }, timeout < 1000 ? 1000 : timeout);
                }
                else {
                    resolve(responseCheckUrlRes);
                }
            }
            catch (e) {
                this.removeResponseListener(page, url);
                responseCheckUrlRes.error = e;
                resolve(responseCheckUrlRes);
            }
        });
    }
    static onceResponse(page, url, listener, timeout) {
        return this.onResponse(page, url, listener, 1, timeout);
    }
    static removeResponseListener(page, url) {
        if (page == null || url == null)
            return;
        let responseCheckUrls = page[kResponseCheckUrls];
        if (responseCheckUrls) {
            while (true) {
                const index = responseCheckUrls.findIndex(item => item.url === url);
                if (index > -1) {
                    responseCheckUrls.splice(index, 1);
                }
                else
                    break;
            }
        }
    }
    static downloadImg(page, selectorOrSrc, saveDir, timeout = 30000) {
        const time = new Date().getTime();
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const imgId = "img_" + time + parseInt("" + Math.random() * 10000);
            const imgSrc = yield page.evaluate((selectorOrSrc, imgId) => {
                try {
                    const isSrc = selectorOrSrc.startsWith("http") || selectorOrSrc.startsWith("//");
                    if (isSrc) {
                        const img = document.createElement("img");
                        img.id = imgId;
                        img.style.display = "none";
                        document.body.appendChild(img);
                        window[imgId] = img;
                        return selectorOrSrc;
                    }
                    else {
                        const img = document.querySelector(selectorOrSrc);
                        if (img) {
                            window[imgId] = img;
                            return img.src;
                        }
                    }
                }
                catch (e) {
                    console.warn(e.stack);
                }
                return null;
            }, selectorOrSrc, imgId);
            if (imgSrc) {
                const newImgSrc = imgSrc + (imgSrc.indexOf("?") == -1 ? "?" : "&") + new Date().getTime() + "_" + (Math.random() * 10000).toFixed(0);
                let topFrame = this.getIFramePage(page);
                const waitRespnse = PuppeteerUtil.onceResponse(topFrame, newImgSrc, (response) => __awaiter(this, void 0, void 0, function* () {
                    if (response.ok()) {
                        let saveName = null;
                        let suffix = "png";
                        const contentType = (yield response.headers())["content-type"];
                        if (contentType && contentType.match("^image/.*")) {
                            suffix = contentType.substring(6);
                        }
                        let match;
                        if (match = imgSrc.match(".*/([^.?&/]+).*$")) {
                            saveName = match[1] + "." + suffix;
                        }
                        if (!saveName)
                            saveName = new Date().getTime() + "_" + parseInt("" + Math.random() * 1000) + "." + suffix;
                        if (FileUtil_1.FileUtil.mkdirs(saveDir)) {
                            const savePath = (saveDir + (saveDir.endsWith("/") ? "" : "/") + saveName).replace(/\\/g, '/');
                            const buffer = yield response.buffer();
                            fs.writeFile(savePath, buffer, err => {
                                if (err) {
                                    resolve({
                                        success: false,
                                        cost: new Date().getTime() - time,
                                        error: DownloadImgError.WriteFileFail
                                    });
                                }
                                else {
                                    resolve({
                                        success: true,
                                        cost: new Date().getTime() - time,
                                        src: imgSrc,
                                        size: buffer.length,
                                        savePath: savePath
                                    });
                                }
                            });
                        }
                        else {
                            resolve({
                                success: false,
                                cost: new Date().getTime() - time,
                                error: DownloadImgError.MkdirsFail
                            });
                        }
                    }
                    else {
                        resolve({
                            success: false,
                            cost: new Date().getTime() - time,
                            error: DownloadImgError.DownloadFail,
                            status: response.status()
                        });
                    }
                }), timeout);
                yield page.evaluate((imgId, newSrc) => {
                    window[imgId].src = newSrc;
                }, imgId, newImgSrc);
                yield waitRespnse.then(res => {
                    if (res.isTimeout) {
                        resolve({
                            success: false,
                            cost: new Date().getTime() - time,
                            error: DownloadImgError.Timeout
                        });
                    }
                });
            }
            else {
                resolve({
                    success: false,
                    cost: new Date().getTime() - time,
                    error: DownloadImgError.ImgNotFound
                });
            }
        }));
    }
    static links(page, predicts, onlyAddToFirstMatch = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (predicts == null || Object.keys(predicts).length == 0)
                return {};
            const predictExpEncode = predictExp => {
                if (typeof predictExp == "function") {
                    return "function " + predictExp.toString();
                }
                else if (predictExp instanceof RegExp) {
                    return "RegExp " + predictExp.toString();
                }
                else
                    return "string " + predictExp;
            };
            const predictStrMap = {};
            for (let groupName of Object.keys(predicts)) {
                const predict = predicts[groupName];
                if (predict.constructor == Array) {
                    predictStrMap[groupName] = [predict[0], predictExpEncode(predict[1])];
                }
                else {
                    predictStrMap[groupName] = predictExpEncode(predict);
                }
            }
            return yield page.evaluate((predictStrMap, onlyAddToFirstMatch) => {
                const hrefs = {};
                const existed = {};
                const all = document.querySelectorAll("a") || [];
                const predictExpDecode = predictExp => {
                    const spaceI = predictExp.indexOf(' ');
                    const predictType = predictExp.substring(0, spaceI);
                    const predictRegPrFunStr = predictExp.substring(spaceI + 1);
                    let predictRegOrFun = null;
                    if (predictType == "function" || predictType == "RegExp") {
                        eval("predictRegOrFun = " + predictRegPrFunStr);
                    }
                    else
                        predictRegOrFun = predictRegPrFunStr;
                    return predictRegOrFun;
                };
                for (let groupName of Object.keys(predictStrMap)) {
                    const predict = predictStrMap[groupName];
                    let selector = null;
                    let predictStr = null;
                    let predictRegOrFun = null;
                    if (predict.constructor == Array) {
                        selector = predict[0];
                        predictStr = predict[1];
                    }
                    else
                        predictStr = predict;
                    predictRegOrFun = predictExpDecode(predictStr);
                    const aArr = selector ? (document.querySelectorAll(selector) || []) : all;
                    const matchHrefs = {};
                    for (let a of aArr) {
                        let href = a.href;
                        if (!onlyAddToFirstMatch || !existed[href]) {
                            let match = false;
                            if (typeof predictRegOrFun == 'function') {
                                if (href = predictRegOrFun(a)) {
                                    match = true;
                                }
                            }
                            else {
                                if (href.match(predictRegOrFun))
                                    match = true;
                            }
                            if (match) {
                                matchHrefs[href] = true;
                                if (onlyAddToFirstMatch) {
                                    existed[href] = true;
                                }
                            }
                        }
                    }
                    hrefs[groupName] = Object.keys(matchHrefs);
                }
                return hrefs;
            }, predictStrMap, onlyAddToFirstMatch);
        });
    }
    static count(page, selector) {
        return page.evaluate(selector => {
            const doms = document.querySelectorAll(selector);
            if (doms)
                return doms.length;
            else
                return 0;
        }, selector);
    }
    static specifyIdByJquery(page, selector) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.addJquery(page);
            return yield page.evaluate(selector => {
                const $items = jQuery(selector);
                if ($items.length) {
                    const ids = [];
                    for (let i = 0; i < $items.length; i++) {
                        const $item = $($items[i]);
                        const id = $item.attr("id");
                        if (id) {
                            ids.push(id);
                        }
                        else {
                            const specialId = "special_" + new Date().getTime() + "_" + (Math.random() * 99999).toFixed(0) + "_" + i;
                            $item.attr("id", specialId);
                            ids.push(specialId);
                        }
                    }
                    return ids;
                }
                else
                    return null;
            }, selector);
        });
    }
    static scrollToBottom(page, scrollTimeout = 30000, scrollInterval = 250, scrollYDelta = 500) {
        return new Promise(resolve => {
            if (scrollTimeout > 0) {
                setTimeout(() => {
                    resolve(false);
                }, scrollTimeout);
            }
            let lastScrollY;
            let scrollYEqualNum = 0;
            const scrollAndCheck = () => {
                page.evaluate((scrollYDelta) => {
                    window.scrollBy(0, scrollYDelta);
                    return window.scrollY;
                }, scrollYDelta).then(scrollY => {
                    if (lastScrollY == scrollY) {
                        scrollYEqualNum++;
                        if (scrollYEqualNum >= 4) {
                            resolve(true);
                        }
                        else
                            setTimeout(scrollAndCheck, 250);
                    }
                    else {
                        scrollYEqualNum = 0;
                        lastScrollY = scrollY;
                        setTimeout(scrollAndCheck, scrollInterval);
                    }
                });
            };
            scrollAndCheck();
        });
    }
    static parseCookies(cookiesStr) {
        const cookieLines = cookiesStr.split("\n");
        const cookies = [];
        const expiresToSeconds = expires => {
            try {
                const time = new Date(expires).getTime();
                if (!isNaN(time)) {
                    return time / 1000;
                }
            }
            catch (e) {
            }
            return undefined;
        };
        cookieLines.forEach(cookieLine => {
            if (cookieLine && cookieLine.trim()) {
                const [name, value, domain, path, expires, size, http, secure, sameSite] = cookieLine.split("\t");
                cookies.push({
                    name: name,
                    value: value,
                    domain: domain,
                    path: path,
                    expires: expiresToSeconds(expires),
                    httpOnly: http === "✓",
                    secure: secure === "✓",
                    sameSite: sameSite
                });
            }
        });
        return cookies;
    }
    static useProxy(page, proxy, enableCache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            page["_proxy"] = proxy;
            page["_enableCacheInProxy"] = enableCache;
            yield page.setRequestInterception(true);
            if (!page["_proxyHandler"]) {
                const _proxyHandler = (req) => __awaiter(this, void 0, void 0, function* () {
                    const proxy = page["_proxy"];
                    const enableCache = page["_enableCacheInProxy"];
                    if (req["_interceptionHandled"] || !req["_allowInterception"]) {
                        return;
                    }
                    else if (proxy && req.url().startsWith("http")) {
                        if (!req.isNavigationRequest()) {
                            const responseCache = enableCache ? yield page.evaluate(url => {
                                const cache = localStorage.getItem(url);
                                if (cache) {
                                    if (parseInt(cache.substring(0, cache.indexOf("\n"))) <= new Date().getTime()) {
                                        localStorage.removeItem(url);
                                    }
                                    else {
                                        return cache;
                                    }
                                }
                            }, req.url()).catch(err => { }) : null;
                            if (responseCache) {
                                let [expires, statusCodeStr, bodyBase64] = responseCache.split("\n");
                                const statusCode = +statusCodeStr;
                                const body = Buffer.from(bodyBase64, "base64");
                                yield req.respond({
                                    status: statusCode,
                                    headers: {
                                        cache: "from-local-storage"
                                    },
                                    body: body
                                });
                                return;
                            }
                        }
                        const options = {
                            url: req.url(),
                            method: req.method(),
                            headers: req.headers(),
                            body: req.postData(),
                            proxy: proxy
                        };
                        try {
                            if (options.headers && (options.headers.cookie == null || options.headers.Cookie == null)) {
                                const cookies = yield page.cookies(options.url);
                                if (cookies.length) {
                                    options.headers.cookie = cookies.map(item => item.name + "=" + item.value).join("; ");
                                }
                            }
                            const proxyRes = yield RequestUtil_1.RequestUtil.simple(options);
                            const headers = proxyRes.headers;
                            for (let name in headers) {
                                const value = headers[name];
                                if (name == "set-cookie") {
                                    if (value.length == 0) {
                                        headers[name] = ("" + value[0]);
                                    }
                                    else {
                                        const setCookies = [];
                                        for (let item of value) {
                                            const setCookie = {
                                                name: null,
                                                value: null
                                            };
                                            item.split("; ").forEach((keyVal, keyValI) => {
                                                const eqI = keyVal.indexOf("=");
                                                let key;
                                                let value;
                                                if (eqI > -1) {
                                                    key = keyVal.substring(0, eqI);
                                                    value = keyVal.substring(eqI + 1);
                                                }
                                                else {
                                                    key = keyVal;
                                                    value = "";
                                                }
                                                const lowerKey = key.toLowerCase();
                                                if (keyValI == 0) {
                                                    setCookie.name = key;
                                                    setCookie.value = value;
                                                }
                                                else if (lowerKey == "expires") {
                                                    const expires = new Date(value).getTime();
                                                    if (!isNaN(expires)) {
                                                        setCookie.expires = +(expires / 1000).toFixed(0);
                                                    }
                                                }
                                                else if (lowerKey == "max-age") {
                                                    if (!setCookie.expires) {
                                                        const expires = +value;
                                                        if (!isNaN(expires)) {
                                                            setCookie.expires = expires;
                                                        }
                                                    }
                                                }
                                                else if (lowerKey == "path" || key == "domain") {
                                                    setCookie[lowerKey] = value;
                                                }
                                                else if (lowerKey == "samesite") {
                                                    setCookie.httpOnly = true;
                                                }
                                                else if (lowerKey == "httponly") {
                                                    setCookie.httpOnly = true;
                                                }
                                                else if (lowerKey == "secure") {
                                                    setCookie.secure = true;
                                                }
                                            });
                                            headers["set-cookie-" + setCookies.length] = item;
                                            setCookies.push(setCookie);
                                        }
                                        yield page.setCookie(...setCookies).catch(err => { });
                                        delete headers[name];
                                    }
                                }
                                else if (typeof value != "string") {
                                    if (value instanceof Array) {
                                        headers[name] = JSON.stringify(value);
                                    }
                                    else {
                                        headers[name] = "" + value;
                                    }
                                }
                            }
                            if (!req.isNavigationRequest()) {
                                const expires = new Date(headers.expires || headers.Expires).getTime();
                                if (enableCache && expires > new Date().getTime()) {
                                    const bodyBase64 = proxyRes.body.toString("base64");
                                    const responseCache = `${expires}\n${proxyRes.status}\n${bodyBase64}`;
                                    yield page.evaluate((url, responseCache) => {
                                        localStorage.setItem(url, responseCache);
                                    }, req.url(), responseCache).catch(err => { });
                                }
                            }
                            yield req.respond(proxyRes).catch(err => { });
                        }
                        catch (err) {
                            yield req.abort("failed").catch(err => { });
                        }
                    }
                });
                page.on("request", _proxyHandler);
            }
        });
    }
    static triggerAndWaitRequest(page, trigger, predict, timeout = 1000, printReqUrlLog = false) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const handler = (req) => {
                printReqUrlLog && logger_1.logger.debug(req.url());
                if (predict(req.url())) {
                    page.off("request", handler);
                    resolve(req);
                }
            };
            page.on("request", handler);
            yield trigger();
            setTimeout(() => {
                resolve(null);
            }, timeout);
        }));
    }
    static triggerAndWaitResponse(page, trigger, predict, timeout = 1000, printResUrlLog = false) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const handler = (res) => {
                printResUrlLog && logger_1.logger.debug(res.url());
                if (predict(res.url())) {
                    page.off("response", handler);
                    resolve(res);
                }
            };
            page.on("response", handler);
            yield trigger();
            setTimeout(() => {
                resolve(null);
            }, timeout);
        }));
    }
    static getIFramePage(pageOrFrame) {
        let curFrame = pageOrFrame;
        let parentFrame;
        while (curFrame.parentFrame && (parentFrame = curFrame.parentFrame())) {
            curFrame = parentFrame;
        }
        return curFrame;
    }
    static getIFramePageAndPos(pageOrFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            let frameLeft = 0;
            let frameTop = 0;
            let curFrame = pageOrFrame;
            let parentFrame;
            while (curFrame.parentFrame && (parentFrame = curFrame.parentFrame())) {
                const curFrameName = curFrame.name();
                const curFrameUrl = curFrame.url();
                const [curFrameDomLeft, curFrameDomTop] = yield parentFrame.evaluate((frameName, frameUrl) => {
                    let frame = null;
                    if (frameName) {
                        frame = document.querySelector(`iframe[name='${frameName}']`);
                        if (!frame) {
                            frame = document.querySelector(`iframe#${frameName}`);
                        }
                    }
                    if (!frame) {
                        frame = Array.from(document.querySelectorAll(`iframe`)).find(item => item.src == frameUrl);
                    }
                    const rect = frame.getBoundingClientRect();
                    return [rect.left, rect.top];
                }, curFrameName, curFrameUrl);
                frameLeft += curFrameDomLeft;
                frameTop += curFrameDomTop;
                curFrame = parentFrame;
            }
            return [curFrame["_frameManager"]._page, frameLeft, frameTop];
        });
    }
    static drag(page, from, to, duration = 0.6, steps = 60, easing = "quarticInOut") {
        return __awaiter(this, void 0, void 0, function* () {
            const xs = Paths_1.Paths.easing(from[0], to[0], duration, steps, easing);
            const ys = Paths_1.Paths.randomOffset(from[1], to[1], steps);
            const newDragPath = [];
            for (let i = 0; i < xs.length; i++) {
                newDragPath.push([xs[i], ys[i]]);
            }
            yield page.mouse.move(newDragPath[0][0], newDragPath[0][1]);
            yield page.mouse.down();
            for (let i = 1; i < newDragPath.length; i++) {
                page.mouse.move(newDragPath[i][0], newDragPath[i][1], { steps: 1 }).catch(err => { });
                yield __1.PromiseUtil.sleep(duration / steps * 1000);
            }
            yield page.mouse.up();
        });
    }
    static dragBar(page, barSelector, wrapperSelector) {
        return __awaiter(this, void 0, void 0, function* () {
            const dragFromTo = yield page.evaluate((barSelector, wrapperSelector) => {
                const bar = document.querySelector(barSelector);
                const wrapper = document.querySelector(wrapperSelector);
                const barRect = bar.getBoundingClientRect();
                const wrapperRect = wrapper.getBoundingClientRect();
                const mDownPosL = Math.floor(barRect.width * (Math.random() * 0.5 + 0.25));
                const mDownPosT = Math.floor(barRect.height * (Math.random() * 0.5 + 0.25));
                const from = [
                    barRect.left + mDownPosL,
                    barRect.top + mDownPosT
                ];
                const to = [
                    wrapperRect.left + wrapperRect.width + Math.floor(barRect.width * Math.random() * 0.5),
                    wrapperRect.top + Math.floor(wrapperRect.height * (Math.random() * 0.5 + 0.25))
                ];
                return [from, to];
            }, barSelector, wrapperSelector);
            const [topPage, frameLeft, frameTop] = yield this.getIFramePageAndPos(page);
            if (frameLeft || frameTop) {
                dragFromTo[0][0] += frameLeft;
                dragFromTo[0][1] += frameTop;
                dragFromTo[1][0] += frameLeft;
                dragFromTo[1][1] += frameTop;
            }
            yield this.drag(topPage, dragFromTo[0], dragFromTo[1], 0.45 + Math.random() * 0.25, 60, "sinusoidalInOut");
        });
    }
    static dragJigsaw(page, sliderSelector, frontSelector, backSelector, distanceFix = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const [topPage, frameLeft, frameTop] = yield this.getIFramePageAndPos(page);
            const getImageInfo = (selector) => page.evaluate(selector => {
                const dom = document.querySelector(selector);
                const rect = dom.getBoundingClientRect();
                let imgSrc = null;
                if (dom.nodeName == "CANVAS") {
                    imgSrc = dom.toDataURL('image/png');
                }
                else if (dom.nodeName == "IMG") {
                    imgSrc = dom.src;
                }
                return {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    src: imgSrc
                };
            }, selector).then((res) => __awaiter(this, void 0, void 0, function* () {
                if (!res.src.startsWith("data:image/png;base64,")) {
                    const pageUrl = page.url();
                    const imgUrl = url.resolve(pageUrl, res.src);
                    const imgRes = yield RequestUtil_1.RequestUtil.simple({
                        url: imgUrl,
                        headers: {
                            "Referer": pageUrl,
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"
                        }
                    });
                    const imgType = imgRes.headers["content-type"] || "image/png";
                    res.src = `data:${imgType};base64,` + imgRes.body.toString("base64");
                }
                return res;
            }));
            const frontInfo = yield getImageInfo(frontSelector);
            const backInfo = yield getImageInfo(backSelector);
            const jigsawInfo = {
                distanceFix: distanceFix ? distanceFix.toString() : null,
                front: frontInfo,
                back: backInfo
            };
            const AnalysisJigsawHtmlSrcF = path.resolve(__filename, "../../../src/puppeteer/AnalysisJigsaw_v3.html");
            if (fs.existsSync(AnalysisJigsawHtmlSrcF)) {
                const jigsawJsonF = path.resolve("jigsaw-" + __1.DateUtil.toStr(new Date(), "YYYYMMDDHHmmss") + ".json");
                const AnalysisJigsawHtmlF = path.resolve(__filename, "../../spider/ui/web/AnalysisJigsaw.html");
                if (!fs.existsSync(AnalysisJigsawHtmlF)) {
                    fs.copyFileSync(AnalysisJigsawHtmlSrcF, AnalysisJigsawHtmlF);
                }
                fs.writeFileSync(jigsawJsonF, JSON.stringify(jigsawInfo), "utf-8");
                logger_1.logger.debugValid && logger_1.logger.debug(`open the following url in browser: \nhttp://localhost:${__1.appInfo.webUiPort || 9000}/AnalysisJigsaw.html\nthen open file: \n${jigsawJsonF}`);
            }
            let dragDistance = yield page.evaluate((jigsawInfo) => __awaiter(this, void 0, void 0, function* () {
                function createImgCanvas(imgInfo) {
                    return new Promise(resolve => {
                        const img = document.createElement("img");
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = imgInfo.width;
                            canvas.height = imgInfo.height;
                            const context = canvas.getContext("2d");
                            context.drawImage(img, 0, 0, canvas.width, canvas.height);
                            resolve([canvas, context]);
                        };
                        img.src = imgInfo.src;
                    });
                }
                const offsetL = jigsawInfo.front.left - jigsawInfo.back.left;
                const offsetT = jigsawInfo.front.top - jigsawInfo.back.top;
                const [frontCanvas, frontContext] = yield createImgCanvas(jigsawInfo.front);
                const [backCanvas, backContext] = yield createImgCanvas(jigsawInfo.back);
                const [frontCanvasForDebug, frontContextForDebug] = [null, null];
                const [backCanvasForDebug, backContextForDebug] = [null, null];
                {
                    const to0123 = (imageData, front0123) => {
                        const grays = [];
                        let grayAvg = 0;
                        for (let i = 0, len = imageData.length; i < len; i += 4) {
                            const color = imageData.subarray(i, i + 4);
                            if (color[3] < 255 || (front0123 && front0123[Math.floor(i / 4)] === -1)) {
                                grays.push(-1);
                            }
                            else {
                                const gray = color[0] * 0.3 + color[1] * 0.59 + color[2] * 0.11;
                                grays.push(gray);
                                grayAvg += gray;
                            }
                        }
                        grayAvg /= grays.length;
                        let grayAvgLower = 0;
                        let grayAvgLowerNum = 0;
                        let grayAvgUpper = 0;
                        let grayAvgUpperNum = 0;
                        for (let item of grays) {
                            if (item === -1) {
                            }
                            else if (item < grayAvg) {
                                grayAvgLower += item;
                                grayAvgLowerNum++;
                            }
                            else {
                                grayAvgUpper += item;
                                grayAvgUpperNum++;
                            }
                        }
                        grayAvgLower /= grayAvgLowerNum || 1;
                        grayAvgUpper /= grayAvgUpperNum || 1;
                        return grays.map(item => item === -1 ? -1 : (item < grayAvgLower ? 0 : (item < grayAvg ? 1 : (item < grayAvgUpper ? 2 : 3))));
                    };
                    const sameOf0123 = (arr1, arr2) => {
                        return arr1.map((item, index) => item === -1 ? 0 : 1 - Math.abs(item - arr2[index]) * 0.8).reduce((preV, curV) => preV + curV);
                    };
                    const notTransparentNum = colors => {
                        let res = 0;
                        for (let i = 3; i < colors.length; i += 4) {
                            if (colors[i] >= 200) {
                                res++;
                            }
                        }
                        return res;
                    };
                    const colorLevels = [
                        [0, 187, 255, 255],
                        [0, 255, 136, 255],
                        [216, 255, 0, 255],
                        [255, 0, 95, 255],
                    ];
                    const translateColorLevels = (imageData, color0123) => {
                        color0123.forEach((value, index) => {
                            if (value > -1) {
                                imageData.set(colorLevels[value], index * 4);
                            }
                        });
                    };
                    let maskEdgeL = null;
                    let maskEdgeR = null;
                    let maskEdgeT = null;
                    let maskEdgeB = null;
                    let maskEdgeMargin = 3;
                    for (let x = 0; x < frontCanvas.width; x++) {
                        const maskColors = frontContext.getImageData(x, 0, 1, frontCanvas.height).data;
                        if (notTransparentNum(maskColors) > 20) {
                            if (maskEdgeL == null) {
                                maskEdgeL = x;
                            }
                            maskEdgeR = x;
                        }
                    }
                    for (let y = 0; y < frontCanvas.height; y++) {
                        const maskColors = frontContext.getImageData(0, y, frontCanvas.width, 1).data;
                        if (notTransparentNum(maskColors) > 20) {
                            if (maskEdgeT == null) {
                                maskEdgeT = y;
                            }
                            maskEdgeB = y;
                        }
                    }
                    maskEdgeL += maskEdgeMargin;
                    maskEdgeR -= maskEdgeMargin;
                    maskEdgeT += maskEdgeMargin;
                    maskEdgeB -= maskEdgeMargin;
                    let bestSame = 0;
                    let bestDelta = backCanvas.width - (maskEdgeR - maskEdgeL) - 12;
                    const frontImageData = frontContext.getImageData(maskEdgeL, maskEdgeT, maskEdgeR - maskEdgeL, maskEdgeB - maskEdgeT).data;
                    const front0123 = to0123(frontImageData, null);
                    for (let xDelta = 25; xDelta < backCanvas.width - 25; xDelta++) {
                        const backImageData = backContext.getImageData(maskEdgeL + xDelta, maskEdgeT + offsetT, maskEdgeR - maskEdgeL, maskEdgeB - maskEdgeT).data;
                        const back0123 = to0123(backImageData, front0123);
                        const same = sameOf0123(front0123, back0123);
                        if (bestSame <= same) {
                            bestSame = same;
                            bestDelta = xDelta;
                        }
                    }
                    if (frontCanvasForDebug) {
                        frontContextForDebug.fillStyle = `rgb(255, 128, 83)`;
                        frontContextForDebug.fillRect(maskEdgeL, 0, 1, frontCanvasForDebug.height);
                        frontContextForDebug.fillRect(maskEdgeR, 0, 1, frontCanvasForDebug.height);
                        frontContextForDebug.fillRect(0, maskEdgeT, frontCanvasForDebug.width, 1);
                        frontContextForDebug.fillRect(0, maskEdgeB, frontCanvasForDebug.width, 1);
                        const imageData = frontContextForDebug.getImageData(maskEdgeL, maskEdgeT, maskEdgeR - maskEdgeL, maskEdgeB - maskEdgeT);
                        translateColorLevels(imageData.data, front0123);
                        frontContextForDebug.putImageData(imageData, maskEdgeL, maskEdgeT);
                    }
                    if (backContextForDebug) {
                        backContextForDebug.fillStyle = `rgb(255, 128, 83)`;
                        backContextForDebug.fillRect(maskEdgeL + bestDelta, 0, 1, backCanvasForDebug.height);
                        backContextForDebug.fillRect(maskEdgeR + bestDelta, 0, 1, backCanvasForDebug.height);
                        backContextForDebug.fillRect(0, maskEdgeT + offsetT, backCanvasForDebug.width, 1);
                        backContextForDebug.fillRect(0, maskEdgeB + offsetT, backCanvasForDebug.width, 1);
                        const backImageData = backContext.getImageData(maskEdgeL + bestDelta, maskEdgeT + offsetT, maskEdgeR - maskEdgeL, maskEdgeB - maskEdgeT);
                        const back0123 = to0123(backImageData.data, front0123);
                        translateColorLevels(backImageData.data, back0123);
                        backContextForDebug.putImageData(backImageData, maskEdgeL + bestDelta, maskEdgeT + offsetT);
                    }
                    return bestDelta - offsetL;
                }
            }), jigsawInfo);
            typeof distanceFix == "function" && (dragDistance = distanceFix(dragDistance));
            const dragPoint = yield page.evaluate((sliderSelector) => {
                const rect = document.querySelector(sliderSelector).getBoundingClientRect();
                return [
                    rect.left + rect.width * (Math.random() * 0.5 + 0.25),
                    rect.top + rect.height * (Math.random() * 0.5 + 0.25)
                ];
            }, sliderSelector);
            const dur = Math.min(Math.max(dragDistance / 180, 0.45), 0.9);
            yield this.drag(topPage, [dragPoint[0] + frameLeft, dragPoint[1] + frameTop], [dragPoint[0] + frameLeft + dragDistance, dragPoint[1] + frameTop + Math.random() * 6 - 3], dur, dragDistance / 8, "quarticInOut");
        });
    }
}
exports.PuppeteerUtil = PuppeteerUtil;
//# sourceMappingURL=PuppeteerUtil.js.map