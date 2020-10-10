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
class NetworkTracing {
    constructor(page) {
        this.requestMap = {};
        let requestIndex = 0;
        page.prependListener("request", this.onRequest = (req) => {
            const _requestId = req["_requestId"];
            this.requestMap[_requestId] = {
                id: _requestId,
                sort: requestIndex++,
                url: req.url(),
                method: req.method,
                time: new Date().getTime()
            };
        });
        page.on("response", this.onResponse = (res) => __awaiter(this, void 0, void 0, function* () {
            const response = this.requestMap[res["_request"]["_requestId"]].response = {
                status: res["_status"],
                contentType: res["_headers"]["content-type"],
                contentLength: res["_headers"]["content-length"],
                fromCache: res["_fromDiskCache"],
                fromServiceWorker: res["_fromServiceWorker"],
                time: new Date().getTime()
            };
            if (response.status == 302) {
                response.location = res["_headers"]["location"];
            }
            if (response.contentLength == null) {
                yield res.buffer()
                    .then(res => {
                    response.contentLength = res.length;
                })
                    .catch(err => {
                    response.contentLength = 0;
                });
            }
            else {
                response.contentLength = parseInt(response.contentLength);
            }
        }));
        const requestEnd = (event, success) => {
            const requestInfo = this.requestMap[event["_requestId"]];
            requestInfo.endTime = new Date().getTime();
            requestInfo.success = success;
        };
        page.on("requestfinished", this.onRequestFinished = event => {
            requestEnd(event, true);
        });
        page.on("requestfailed", this.onRequestFailed = event => {
            requestEnd(event, false);
        });
        this.page = page;
        this.startTime = new Date().getTime();
    }
    requests() {
        this.page.removeListener("request", this.onRequest);
        this.page.removeListener("response", this.onResponse);
        this.page.removeListener("requestfinished", this.onRequestFinished);
        this.page.removeListener("requestfailed", this.onRequestFailed);
        const tracing = [];
        for (let key of Object.keys(this.requestMap)) {
            tracing.push(this.requestMap[key]);
        }
        tracing.sort((o1, o2) => o1.sort - o2.sort).map(item => delete item.sort);
        return {
            time: this.startTime,
            requests: tracing
        };
    }
    static requestsToTraceEvents(pageRequests) {
        const startTime = pageRequests.time;
        let lastTime = 0;
        const ts = time => {
            let res = (time - startTime) * 1000;
            if (res == lastTime) {
                res++;
            }
            lastTime = res;
            return res;
        };
        const traceEvents = [];
        traceEvents.push({ "tid": 0, "ts": 0, "ph": "I", "cat": "disabled-by-default-devtools.timeline", "name": "TracingStartedInBrowser", "args": { "data": { "frameTreeNodeId": 0, "persistentIds": true, "frames": [{ "url": "about:blank", "name": "", "processId": 1 }] } } });
        for (let request of pageRequests.requests) {
            traceEvents.push({ "pid": 1, "tid": 1, "ts": ts(request.time), "ph": "I", "cat": "devtools.timeline", "name": "ResourceSendRequest", "args": { "data": { "requestId": request.id, "url": request.url, "requestMethod": request.method } } });
            if (request.response) {
                traceEvents.push({ "pid": 1, "tid": 1, "ts": ts(request.response.time), "ph": "I", "cat": "devtools.timeline", "name": "ResourceReceiveResponse", "args": { "data": { "requestId": request.id, "statusCode": request.response.status, "mimeType": request.response.contentType, "encodedDataLength": request.response.contentLength, "fromCache": request.response.fromCache, "fromServiceWorker": request.response.fromServiceWorker, "timing": { "requestTime": ts(request.time) / 1000000, "sendStart": 0, "receiveHeadersEnd": request.response.time - request.time } } } });
            }
            traceEvents.push({ "pid": 1, "tid": 1, "ts": ts(request.endTime), "ph": "I", "cat": "devtools.timeline", "name": "ResourceFinish", "args": { "data": { "requestId": request.id, "didFail": !request.success, "decodedBodyLength": 0 } } });
        }
        traceEvents.sort((o1, o2) => o1.ts - o2.ts);
        traceEvents.push({ "pid": 1, "tid": 1, "ts": traceEvents[traceEvents.length - 1].ts + 1, "ph": "I", "cat": "devtools.timeline" });
        return {
            traceEvents: traceEvents
        };
    }
}
exports.NetworkTracing = NetworkTracing;
//# sourceMappingURL=NetworkTracing.js.map