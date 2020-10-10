export declare type Sort = {
    [by: string]: -1 | 1;
};
export declare class Pager {
    pageIndex: number;
    pageSize: number;
    match: any;
    projection: any;
    sort: Sort;
    total: number;
    list: any[];
}
export declare class DbDao {
    private static _instances;
    protected url: string;
    protected dbResolve: (db: any) => void;
    protected readonly dbPromise: Promise<any>;
    constructor(url: string);
    static dbs(): string[];
    static db(dbName: string): DbDao;
    waitReady(): Promise<any>;
    collections(): Promise<string[]>;
    collection(collectionName: string): Promise<any>;
    save(collectionName: any, item: any, skipInsert?: boolean): Promise<"insert" | "replace">;
    findById(collectionName: any, _id: string, projection?: any): Promise<any>;
    findOne(collectionName: any, query: any, projection?: any): Promise<any>;
    findList(collectionName: any, query: any, projection?: any, sort?: Sort, skip?: number, limit?: number): Promise<any[]>;
    count(collectionName: any, query: any): Promise<number>;
    remove(collectionName: any, query: any, multi?: boolean): Promise<number>;
    update(collectionName: any, query: any, updateQuery: any, multi?: boolean): Promise<number>;
    page(collectionName: any, pager: Pager): Promise<Pager>;
}
