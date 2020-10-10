"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EasingFunctions {
    constructor() {
        this.linear = (t, b, c, d) => {
            return c * t / d + b;
        };
        this.quadraticIn = (t, b, c, d) => {
            t /= d;
            return c * t * t + b;
        };
        this.quadraticOut = (t, b, c, d) => {
            t /= d;
            return -c * t * (t - 2) + b;
        };
        this.quadraticInOut = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1)
                return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };
        this.cubicIn = (t, b, c, d) => {
            t /= d;
            return c * t * t * t + b;
        };
        this.cubicOut = (t, b, c, d) => {
            t /= d;
            t--;
            return c * (t * t * t + 1) + b;
        };
        this.cubicInOut = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1)
                return c / 2 * t * t * t + b;
            t -= 2;
            return c / 2 * (t * t * t + 2) + b;
        };
        this.quarticIn = (t, b, c, d) => {
            t /= d;
            return c * t * t * t * t + b;
        };
        this.quarticOut = (t, b, c, d) => {
            t /= d;
            t--;
            return -c * (t * t * t * t - 1) + b;
        };
        this.quarticInOut = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1)
                return c / 2 * t * t * t * t + b;
            t -= 2;
            return -c / 2 * (t * t * t * t - 2) + b;
        };
        this.quinticIn = (t, b, c, d) => {
            t /= d;
            return c * t * t * t * t * t + b;
        };
        this.quinticOut = (t, b, c, d) => {
            t /= d;
            t--;
            return c * (t * t * t * t * t + 1) + b;
        };
        this.quinticInOut = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1)
                return c / 2 * t * t * t * t * t + b;
            t -= 2;
            return c / 2 * (t * t * t * t * t + 2) + b;
        };
        this.sinusoidalIn = (t, b, c, d) => {
            return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
        };
        this.sinusoidalOut = (t, b, c, d) => {
            return c * Math.sin(t / d * (Math.PI / 2)) + b;
        };
        this.sinusoidalInOut = (t, b, c, d) => {
            return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
        };
        this.exponentialIn = (t, b, c, d) => {
            return c * Math.pow(2, 10 * (t / d - 1)) + b;
        };
        this.exponentialOut = (t, b, c, d) => {
            return c * (-Math.pow(2, -10 * t / d) + 1) + b;
        };
        this.exponentialInOut = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1)
                return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
            t--;
            return c / 2 * (-Math.pow(2, -10 * t) + 2) + b;
        };
        this.circularIn = (t, b, c, d) => {
            t /= d;
            return -c * (Math.sqrt(1 - t * t) - 1) + b;
        };
        this.circularOut = (t, b, c, d) => {
            t /= d;
            t--;
            return c * Math.sqrt(1 - t * t) + b;
        };
        this.circularInOut = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1)
                return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
            t -= 2;
            return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
        };
    }
}
exports.EasingFunctions = EasingFunctions;
const easingFunctions = new EasingFunctions();
class Paths {
    static randomOffset(from, to, steps, stepOffset = 1, maxOffset = 4) {
        const endSteps = maxOffset / stepOffset;
        const path = [from];
        let cur = from;
        const stepOffsets = [-stepOffset, 0, stepOffset];
        for (let i = 1; i < steps; i++) {
            if (i + endSteps >= steps) {
                const newY = cur + (to - cur) / (steps - i);
                if (Math.abs(newY - cur) > maxOffset) {
                    cur = newY;
                }
            }
            else {
                cur += stepOffsets[Math.floor(Math.random() * stepOffsets.length)];
            }
            path.push(cur);
        }
        path.push(to);
        return path;
    }
    static easing(from, to, duration, steps, easing) {
        const easingFunction = easingFunctions[easing];
        const path = [];
        for (let t = 0; t <= duration; t += duration / steps) {
            const s = easingFunction(t, from, to - from, duration);
            path.push(s);
        }
        return path;
    }
}
exports.Paths = Paths;
//# sourceMappingURL=Paths.js.map