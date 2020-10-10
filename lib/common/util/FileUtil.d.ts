/// <reference types="node" />
export declare class FileUtil {
    static mkdirs(pathStr: string): boolean;
    static parent(pathStr: string): string;
    static write(pathStr: string, content: string | string[] | Buffer, charset?: string): boolean;
    static read(pathStr: string, charset?: string): string;
    static readLines(file: string, charset?: string): Promise<string[]>;
}
