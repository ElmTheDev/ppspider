"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const AbsQueue_1 = require("./AbsQueue");
const PriorityQueue_1 = require("../../common/util/PriorityQueue");
const Serializable_1 = require("../../common/serialize/Serializable");
let DefaultPriorityQueue = class DefaultPriorityQueue extends AbsQueue_1.AbsQueue {
    constructor() {
        super(...arguments);
        this.queue = new PriorityQueue_1.PriorityQueue((j1, j2) => j1.priority - j2.priority);
    }
    isEmpty() {
        return this.queue.isEmpty();
    }
    pop() {
        return this.queue.poll();
    }
    peek() {
        return this.queue.peek();
    }
    push(job) {
        this.queue.offer(job);
    }
    size() {
        return this.queue.size();
    }
};
DefaultPriorityQueue = __decorate([
    Serializable_1.Serializable()
], DefaultPriorityQueue);
exports.DefaultPriorityQueue = DefaultPriorityQueue;
//# sourceMappingURL=DefaultPriorityQueue.js.map