"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
let PriorityQueue = class PriorityQueue {
    constructor(comparator) {
        this.datas = [];
        this.comparator = comparator;
    }
    peek() {
        return this.datas.length == 0 ? null : this.datas[0];
    }
    offer(t) {
        if (!t)
            return false;
        this.datas.push(t);
        const len = this.datas.length;
        if (len > 1) {
            this.siftUp(len - 1, t);
        }
        return true;
    }
    poll() {
        const size = this.datas.length;
        return size == 0 ? null : this.removeAt(0);
    }
    contains(t) {
        return this.datas.indexOf(t) != -1;
    }
    remove(t) {
        const index = this.datas.indexOf(t);
        if (index == -1)
            return false;
        this.removeAt(index);
        return true;
    }
    removeAt(index) {
        const size = this.datas.length;
        if (index >= size)
            return null;
        else if (index + 1 == size) {
            return this.datas.pop();
        }
        const removeT = this.datas[index];
        const movedT = this.datas[index] = this.datas.pop();
        this.siftDown(index, movedT);
        if (movedT == this.datas[index]) {
            this.siftUp(index, this.datas[index]);
        }
        return removeT;
    }
    size() {
        return this.datas.length;
    }
    isEmpty() {
        return this.datas.length == 0;
    }
    siftUp(index, t) {
        while (index > 0) {
            const parent = (index - 1) >>> 1;
            const parentT = this.datas[parent];
            if (this.comparator(t, parentT) >= 0)
                break;
            this.datas[index] = parentT;
            index = parent;
        }
        this.datas[index] = t;
    }
    siftDown(index, t) {
        const size = this.datas.length;
        const half = size >>> 1;
        while (index < half) {
            let child = (index << 1) + 1;
            let childT = this.datas[child];
            let right = child + 1;
            if (right < size && this.comparator(childT, this.datas[right]) > 0) {
                childT = this.datas[child = right];
            }
            if (this.comparator(t, childT) <= 0)
                break;
            this.datas[index] = childT;
            index = child;
        }
        this.datas[index] = t;
    }
};
PriorityQueue = __decorate([
    __1.Serializable(),
    __metadata("design:paramtypes", [Function])
], PriorityQueue);
exports.PriorityQueue = PriorityQueue;
//# sourceMappingURL=PriorityQueue.js.map