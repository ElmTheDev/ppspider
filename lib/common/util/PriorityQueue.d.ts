export declare class PriorityQueue<T> {
    private datas;
    private comparator;
    constructor(comparator: (t1: T, t2: T) => number);
    peek(): T;
    offer(t: T): boolean;
    poll(): T;
    contains(t: T): boolean;
    remove(t: T): boolean;
    removeAt(index: number): T;
    size(): number;
    isEmpty(): boolean;
    private siftUp;
    private siftDown;
}
