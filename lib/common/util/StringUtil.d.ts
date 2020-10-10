export declare class StringUtil {
    static random(len: number, chars?: string): string;
    static isBlank(str: string): boolean;
    private static lastIdTime;
    private static lastIdIndex;
    static id(): string;
    static preFill(str: string, fillLength: number, fillStr: string): string;
}
