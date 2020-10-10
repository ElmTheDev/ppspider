"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ObjectUtil {
    static deepAssign(from, to) {
        if (from == null || to == null)
            return;
        if (from.constructor == Array) {
            this.copyArr(from, to);
        }
        else {
            for (let fromKey in from) {
                const fromValue = from[fromKey];
                if (!to.hasOwnProperty(fromKey))
                    to[fromKey] = fromValue;
                else {
                    const toValue = to[fromKey];
                    if (fromValue == null || toValue == null || toValue.constructor != fromValue.constructor)
                        to[fromKey] = fromValue;
                    else {
                        if (fromValue.constructor == Object) {
                            this.deepAssign(fromValue, toValue);
                        }
                        else if (fromValue.constructor == Array) {
                            this.copyArr(fromValue, toValue);
                        }
                        else if (fromValue != toValue) {
                            to[fromKey] = fromValue;
                        }
                    }
                }
            }
        }
    }
    static copyArr(from, to) {
        for (let i = 0, len = from.length; i < len; i++) {
            let fromValueI = from[i];
            let toValueI = to[i];
            if (fromValueI == null || toValueI == null || fromValueI.constructor != toValueI.constructor) {
                to[i] = fromValueI;
            }
            else if (fromValueI.constructor == Object) {
                this.deepAssign(fromValueI, toValueI);
            }
            else if (fromValueI.constructor == Array) {
                this.copyArr(fromValueI, toValueI);
            }
            else if (fromValueI != toValueI) {
                to[i] = fromValueI;
            }
        }
        to.splice(from.length);
    }
    static transform(obj, trans) {
        if (obj == null)
            return null;
        if (obj instanceof Array) {
            for (let i = 0, len = obj.length; i < len; i++) {
                obj[i] = this.transform(obj[i], trans);
            }
        }
        else if (typeof obj == "object") {
            for (let key of Object.keys(obj)) {
                obj[key] = this.transform(obj[key], trans);
            }
        }
        return trans(obj);
    }
    static deepClone(source) {
        return JSON.parse(JSON.stringify(source));
    }
}
exports.ObjectUtil = ObjectUtil;
//# sourceMappingURL=ObjectUtil.js.map