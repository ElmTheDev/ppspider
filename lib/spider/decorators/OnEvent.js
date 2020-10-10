"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Launcher_1 = require("./Launcher");
function OnEvent(event) {
    return function (target, key, descriptor) {
        const config = {
            event: event,
            target: target.constructor,
            method: key
        };
        Launcher_1.addOnEventConfig(config);
        return descriptor;
    };
}
exports.OnEvent = OnEvent;
//# sourceMappingURL=OnEvent.js.map