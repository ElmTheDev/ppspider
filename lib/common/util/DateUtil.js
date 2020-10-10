"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
class DateUtil {
    static toStr(date = new Date(), format = "YYYY-MM-DD HH:mm:ss") {
        return moment(date).format(format);
    }
}
exports.DateUtil = DateUtil;
//# sourceMappingURL=DateUtil.js.map