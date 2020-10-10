"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const AbsQueue_1 = require("./AbsQueue");
const Serializable_1 = require("../../common/serialize/Serializable");
let DefaultQueue = class DefaultQueue extends AbsQueue_1.AbsQueue {
    constructor() {
        super(...arguments);
        this.queue = [];
    }
    isEmpty() {
        return this.queue.length === 0;
    }
    pop() {
        return this.queue.shift();
    }
    peek() {
        return this.queue.length == 0 ? null : this.queue[0];
    }
    push(job) {
        this.queue.push(job);
    }
    size() {
        return this.queue.length;
    }
};
DefaultQueue = __decorate([
    Serializable_1.Serializable()
], DefaultQueue);
exports.DefaultQueue = DefaultQueue;
//# sourceMappingURL=DefaultQueue.js.map