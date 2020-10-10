"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Launcher_1 = require("./Launcher");
function OnTime(config) {
    return function (target, key, descriptor) {
        config["type"] = "OnTime";
        config["target"] = target.constructor;
        config["method"] = key;
        const methodBody = target[key].toString();
        config["paramnames"] = methodBody.substring(methodBody.indexOf("(") + 1, methodBody.indexOf(")"))
            .split(",").map(item => item.trim()).filter(item => item);
        config["paramtypes"] = Reflect.getMetadata('design:paramtypes', target, key);
        Launcher_1.addJobConfig(config);
        return descriptor;
    };
}
exports.OnTime = OnTime;
//# sourceMappingURL=OnTime.js.map