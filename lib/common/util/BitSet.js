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
var BitSet_1;
Object.defineProperty(exports, "__esModule", { value: true });
const Serializable_1 = require("../serialize/Serializable");
let BitSet = BitSet_1 = class BitSet {
    constructor(arg) {
        this.bytes = {};
        const argType = typeof arg;
        if (argType == "number") {
            this._size = arg;
        }
    }
    get size() {
        return this._size;
    }
    clear() {
        this.bytes = {};
    }
    get(index) {
        if (index >= this._size)
            throw new Error(`index(${index}) is out of size(${this._size})`);
        const numIndex = parseInt("" + index / BitSet_1.perIntBit);
        return ((this.bytes[numIndex] || 0) & (1 << (index % BitSet_1.perIntBit))) === 0 ? 0 : 1;
    }
    set(index, value) {
        if (index >= this._size)
            throw new Error(`index(${index}) is out of size(${this._size})`);
        const numIndex = parseInt("" + index / BitSet_1.perIntBit);
        const indexByte = this.bytes[numIndex] || 0;
        const changeBit = 1 << (index % BitSet_1.perIntBit);
        if (value) {
            this.bytes[numIndex] = indexByte | changeBit;
        }
        else {
            this.bytes[numIndex] = indexByte & (~changeBit);
        }
    }
};
BitSet.perIntBit = 32;
BitSet = BitSet_1 = __decorate([
    Serializable_1.Serializable(),
    __metadata("design:paramtypes", [Object])
], BitSet);
exports.BitSet = BitSet;
//# sourceMappingURL=BitSet.js.map