"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Launcher_1 = require("./Launcher");
function JobOverride(queueName) {
    return function (target, key, descriptor) {
        Launcher_1.addJobOverrideConfig(queueName, {
            target: target,
            method: descriptor.value
        });
        return descriptor;
    };
}
exports.JobOverride = JobOverride;
//# sourceMappingURL=JobOverride.js.map