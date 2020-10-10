"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const request = require("request");
var DownloadResult;
(function (DownloadResult) {
    DownloadResult[DownloadResult["existed"] = 1] = "existed";
    DownloadResult[DownloadResult["success"] = 2] = "success";
    DownloadResult[DownloadResult["downloadFail"] = -1] = "downloadFail";
    DownloadResult[DownloadResult["saveFail"] = -2] = "saveFail";
})(DownloadResult = exports.DownloadResult || (exports.DownloadResult = {}));
class DownloadUtil {
    static download(url, savePath, checkExisted = true) {
        return new Promise((resolve) => {
            if (checkExisted && fs.existsSync(savePath)) {
                resolve(DownloadResult.existed);
            }
            else {
                request.get(url, null, (error, response, body) => {
                    if (error)
                        resolve(DownloadResult.downloadFail);
                    else {
                        fs.writeFile(savePath, body, err => {
                            if (err)
                                resolve(DownloadResult.saveFail);
                            else
                                resolve(DownloadResult.success);
                        });
                    }
                });
            }
        });
    }
}
exports.DownloadUtil = DownloadUtil;
//# sourceMappingURL=DownloadUtil.js.map