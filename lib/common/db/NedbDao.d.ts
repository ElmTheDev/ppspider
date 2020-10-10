import * as Nedb from "nedb";
import { DbDao, Pager, Sort } from "./DbDao";
declare type Nedbs = {
    [collectionName: string]: Promise<Nedb>;
};
export declare class NedbDao extends DbDao {
    protected nedbDir: string;
    protected nedbs: Nedbs;
    constructor(url: string);
    private castRegexInMatch;
    collections(): Promise<string[]>;
    collection(collectionName: string): Promise<Nedb>;
    save(collectionName: string, item: any, skipInsert?: boolean): Promise<"insert" | "replace">;
    private find;
    findById(collectionName: string, _id: string, projection?: any): Promise<any>;
    findOne(collectionName: string, query: any, projection?: any): Promise<any>;
    findList(collectionName: string, query: any, projection?: any, sort?: Sort, skip?: number, limit?: number): Promise<any[]>;
    count(collectionName: string, query: any): Promise<number>;
    remove(collectionName: string, query: any, multi?: boolean): Promise<number>;
    update(collectionName: string, query: any, updateQuery: any, multi?: boolean): Promise<number>;
    page(collectionName: string, pager: Pager): Promise<Pager>;
}
export {};
