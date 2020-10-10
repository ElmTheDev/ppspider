"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BloonFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
const BitSet_1 = require("../../common/util/BitSet");
const Serializable_1 = require("../../common/serialize/Serializable");
let BloonFilter = BloonFilter_1 = class BloonFilter {
    constructor() {
        this.bitSet = new BitSet_1.BitSet(BloonFilter_1.size);
        this.emptyExisted = false;
    }
    clear() {
        this.bitSet.clear();
    }
    isExisted(job) {
        const key = job.key == null ? job.url : job.key;
        if (!key)
            return this.emptyExisted;
        for (let seed of BloonFilter_1.seeds) {
            if (!this.bitSet.get(BloonFilter_1.hash(key, BloonFilter_1.size, seed)))
                return false;
        }
        return true;
    }
    setExisted(job) {
        const key = job.key == null ? job.url : job.key;
        if (key) {
            for (let seed of BloonFilter_1.seeds) {
                this.bitSet.set(BloonFilter_1.hash(key, BloonFilter_1.size, seed), 1);
            }
        }
        else
            this.emptyExisted = true;
    }
    static hash(str, cap, seed) {
        if (!str || !str.length)
            return 0;
        let result = 0;
        for (let i = 0, len = str.length; i < len; i++) {
            result = (seed * result + str.charCodeAt(i)) % cap;
        }
        return (cap - 1) & result;
    }
};
BloonFilter.size = 1 << 25;
BloonFilter.seeds = [7, 11, 13, 31, 37, 61];
BloonFilter = BloonFilter_1 = __decorate([
    Serializable_1.Serializable()
], BloonFilter);
exports.BloonFilter = BloonFilter;
//# sourceMappingURL=BloonFilter.js.map