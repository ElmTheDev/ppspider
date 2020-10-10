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
const request = require("request");
const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const SocksProxyAgent = require("socks-proxy-agent");
const stream_1 = require("stream");
const zlib = require("zlib");
class RequestUtil {
    static simple(options, handler) {
        options.encoding = null;
        const headers = {};
        for (let key in options) {
            if (key == "headers") {
                Object.assign(headers, options.headers);
            }
            else if (key == "headerLines") {
                const parsedHeaders = this.linesToHeaders(options.headerLines);
                Object.assign(headers, parsedHeaders);
            }
        }
        options.headers = headers;
        if (options.proxy) {
            let proxy;
            const typeofProxy = typeof options.proxy;
            if (typeofProxy == "string") {
                proxy = options.proxy;
            }
            else if (typeofProxy == "object" && options.proxy.href) {
                proxy = options.proxy.href;
            }
            if (proxy) {
                options.headers["accept-encoding"] = "identity, gzip, deflate";
                const reqUrl = options["url"] || options["uri"];
                if (proxy.startsWith("socks")) {
                    options.agent = new SocksProxyAgent(options.proxy);
                }
                else if (reqUrl.startsWith("https")) {
                    options.agent = new HttpsProxyAgent(options.proxy);
                }
                else {
                    options.agent = new HttpProxyAgent(options.proxy);
                }
                delete options.proxy;
            }
        }
        return new Promise((resolve, reject) => {
            request(options, (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }
                const simpleRes = {
                    status: res.statusCode,
                    headers: res.headers,
                    body: res["body"] || Buffer.from([])
                };
                if (simpleRes.body.length) {
                    let bodyPipe = new stream_1.PassThrough();
                    const contentEncodings = (res.headers["content-encoding"] || "").split(/, ?/).filter(item => item != "").reverse();
                    for (let contentEncoding of contentEncodings) {
                        switch (contentEncoding) {
                            case "gzip":
                                bodyPipe = bodyPipe.pipe(zlib.createGunzip());
                                break;
                            case "deflate":
                                bodyPipe = bodyPipe.pipe(zlib.createInflate());
                                break;
                        }
                    }
                    let chunks = [];
                    bodyPipe.on("data", chunk => chunks.push(chunk));
                    bodyPipe.on("error", err => reject(err));
                    bodyPipe.on("close", () => {
                        simpleRes.body = Buffer.concat(chunks);
                        resolve(simpleRes);
                    });
                    bodyPipe.write(res["body"], err => bodyPipe.destroy(err));
                }
                else {
                    resolve(simpleRes);
                }
            });
        }).then((res) => __awaiter(this, void 0, void 0, function* () {
            typeof handler == "function" && (yield handler(null, res));
            return res;
        })).catch((err) => __awaiter(this, void 0, void 0, function* () {
            typeof handler == "function" && (yield handler(err, null));
            throw err;
        }));
    }
    static linesToHeaders(lines) {
        const headers = {};
        lines.split(/\r?\n/g).forEach(line => {
            line = line.trim();
            if (line) {
                const divideI = line.indexOf(": ");
                if (divideI > -1) {
                    headers[line.substring(0, divideI)] = line.substring(divideI + 2);
                }
            }
        });
        return headers;
    }
}
exports.RequestUtil = RequestUtil;
//# sourceMappingURL=RequestUtil.js.map