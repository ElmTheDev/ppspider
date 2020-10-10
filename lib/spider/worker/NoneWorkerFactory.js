"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NoneWorkerFactory {
    workerType() {
        return null;
    }
    get() {
        return new Promise(resolve => {
            resolve(null);
        });
    }
    release(worker) {
        return;
    }
    shutdown() {
    }
}
exports.NoneWorkerFactory = NoneWorkerFactory;
//# sourceMappingURL=NoneWorkerFactory.js.map