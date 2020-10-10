"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Launcher_1 = require("./Launcher");
function DataUi(config) {
    return function (target) {
        if (!config.label) {
            config.label = target.name;
        }
        config["target"] = target;
        config["class"] = target.toString();
        config["className"] = target.name;
        Launcher_1.addDataUiConfig(config);
    };
}
exports.DataUi = DataUi;
function DataUiRequest(method) {
    return function (target, key, descriptor) {
        if (method.name === "constructor") {
            throw new Error("DataUiRequest cannot bind to a constructor");
        }
        Launcher_1.addDataUiRequestConfig({
            requestMethod: method,
            handleTarget: target.constructor,
            handleMethod: key
        });
        return descriptor;
    };
}
exports.DataUiRequest = DataUiRequest;
//# sourceMappingURL=DataUi.js.map