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
class PromiseUtil {
    static sleep(timeout) {
        if (timeout < 0)
            timeout = 0;
        return new Promise(resolve => {
            setTimeout(() => resolve(), timeout);
        });
    }
    static wait(predict, interval = 100, timeout = -1) {
        return new Promise((resolve, reject) => {
            const start = new Date().getTime();
            const check = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (yield predict())
                        resolve(true);
                    else if (timeout > -1 && new Date().getTime() - start >= timeout) {
                        reject(new Error("timeout: " + timeout));
                    }
                    else
                        setTimeout(check, interval);
                }
                catch (e) {
                    reject(e);
                }
            });
            check();
        });
    }
    static rejectOrResolve(reject, err, resolve, res) {
        if (err instanceof Error) {
            reject(err);
        }
        else if (resolve) {
            resolve(res);
        }
    }
    static createPromiseResolve() {
        const res = [];
        res[0] = new Promise((resolve, reject) => {
            res[1] = resolve;
            res[2] = reject;
        });
        return res;
    }
}
exports.PromiseUtil = PromiseUtil;
//# sourceMappingURL=PromiseUtil.js.map