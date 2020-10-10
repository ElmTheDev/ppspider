export declare class PromiseUtil {
    static sleep(timeout: number): Promise<void>;
    static wait(predict: () => boolean | Promise<boolean>, interval?: number, timeout?: number): Promise<boolean>;
    static rejectOrResolve(reject: any, err: Error | any, resolve?: any, res?: any): void;
    static createPromiseResolve(): any[];
}
