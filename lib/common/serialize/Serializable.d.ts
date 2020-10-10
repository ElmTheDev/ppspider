/// <reference types="node" />
import { PathLike } from "fs";
interface ClassInfo {
    id?: string;
    type: any;
    pos: any;
}
export declare const getClassInfoById: (id: string) => ClassInfo;
export declare const getClassInfoByConstructor: (constructor: any) => ClassInfo;
export interface SerializableConfig {
    classId?: string;
}
export declare function Serializable(config?: SerializableConfig): (target: any) => void;
export declare function Transient(): (target: any, field: string) => void;
export declare function Assign(target: any, source: any): void;
export declare class SerializableUtil {
    static serializeToFile(obj: any, file: PathLike, encoding?: string): Promise<void>;
    static serializeToString(obj: any): string;
    private static _serialize;
    private static isSimpleType;
    static deserializeFromString(str: string): any;
    static deserializeFromFile(file: PathLike, encoding?: string): Promise<any>;
}
export {};
