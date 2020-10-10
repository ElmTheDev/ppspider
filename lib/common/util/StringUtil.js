"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DateUtil_1 = require("./DateUtil");
class StringUtil {
    static random(len, chars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0987654321") {
        if (len < 1)
            len = 1;
        let str = "";
        for (let i = 0; i < len; i++) {
            const index = parseInt("" + Math.random() * chars.length);
            str += chars[index];
        }
        return str;
    }
    static isBlank(str) {
        return str == null || str.trim() == "";
    }
    static id() {
        const now = new Date();
        if (now.getTime() === this.lastIdTime) {
            this.lastIdIndex++;
        }
        else {
            this.lastIdTime = now.getTime();
            this.lastIdIndex = 0;
        }
        return DateUtil_1.DateUtil.toStr(now, "YYYYMMDD_HHmmss_SSS_")
            + this.preFill("" + this.lastIdIndex, 4, '0');
    }
    static preFill(str, fillLength, fillStr) {
        if (str.length >= fillLength)
            return str;
        for (let i = str.length, fillStrLen = fillStr.length; i < fillLength; i += fillStrLen)
            str = fillStr + str;
        return str;
    }
}
exports.StringUtil = StringUtil;
StringUtil.lastIdIndex = 0;
//# sourceMappingURL=StringUtil.js.map