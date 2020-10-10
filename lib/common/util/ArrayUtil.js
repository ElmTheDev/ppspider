"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArrayUtil {
    static removeIf(arr, predict) {
        if (arr) {
            let j = -1;
            let len = arr.length;
            for (let i = 0; i < len; i++) {
                if (!predict(arr[i], i, arr)) {
                    arr[++j] = arr[i];
                }
            }
            arr.splice(j + 1, len - j - 1);
        }
    }
}
exports.ArrayUtil = ArrayUtil;
//# sourceMappingURL=ArrayUtil.js.map