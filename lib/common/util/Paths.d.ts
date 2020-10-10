export declare class EasingFunctions {
    linear: (t: any, b: any, c: any, d: any) => any;
    quadraticIn: (t: any, b: any, c: any, d: any) => any;
    quadraticOut: (t: any, b: any, c: any, d: any) => any;
    quadraticInOut: (t: any, b: any, c: any, d: any) => any;
    cubicIn: (t: any, b: any, c: any, d: any) => any;
    cubicOut: (t: any, b: any, c: any, d: any) => any;
    cubicInOut: (t: any, b: any, c: any, d: any) => any;
    quarticIn: (t: any, b: any, c: any, d: any) => any;
    quarticOut: (t: any, b: any, c: any, d: any) => any;
    quarticInOut: (t: any, b: any, c: any, d: any) => any;
    quinticIn: (t: any, b: any, c: any, d: any) => any;
    quinticOut: (t: any, b: any, c: any, d: any) => any;
    quinticInOut: (t: any, b: any, c: any, d: any) => any;
    sinusoidalIn: (t: any, b: any, c: any, d: any) => any;
    sinusoidalOut: (t: any, b: any, c: any, d: any) => any;
    sinusoidalInOut: (t: any, b: any, c: any, d: any) => any;
    exponentialIn: (t: any, b: any, c: any, d: any) => any;
    exponentialOut: (t: any, b: any, c: any, d: any) => any;
    exponentialInOut: (t: any, b: any, c: any, d: any) => any;
    circularIn: (t: any, b: any, c: any, d: any) => any;
    circularOut: (t: any, b: any, c: any, d: any) => any;
    circularInOut: (t: any, b: any, c: any, d: any) => any;
}
export declare class Paths {
    static randomOffset(from: number, to: number, steps: number, stepOffset?: number, maxOffset?: number): number[];
    static easing(from: number, to: number, duration: number, steps: number, easing: keyof EasingFunctions): any[];
}
