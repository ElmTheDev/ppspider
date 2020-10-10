export declare class BitSet {
    private bytes;
    private static perIntBit;
    private _size;
    constructor(arg: any);
    get size(): number;
    clear(): void;
    get(index: number): number;
    set(index: number, value: 0 | 1): void;
}
