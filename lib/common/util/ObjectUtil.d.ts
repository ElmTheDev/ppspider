export declare class ObjectUtil {
    static deepAssign(from: any, to: any): void;
    private static copyArr;
    static transform(obj: any, trans: (value: any) => any): any;
    static deepClone(source: any): any;
}
