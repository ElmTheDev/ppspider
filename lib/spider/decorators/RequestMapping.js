"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Launcher_1 = require("./Launcher");
function RequestMapping(url, method = "") {
    return function (target, key, descriptor) {
        const requestMappingConfig = {
            url: url,
            httpMethod: method,
            target: target.constructor,
            method: key
        };
        Launcher_1.addRequestMappingConfig(requestMappingConfig);
        return descriptor;
    };
}
exports.RequestMapping = RequestMapping;
//# sourceMappingURL=RequestMapping.js.map