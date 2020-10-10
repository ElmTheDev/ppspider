import { DbDao, Pager, Sort } from "./DbDao";
import { Collection } from "mongodb";
export declare class MongodbDao extends DbDao {
    protected readonly dbName: string;
    constructor(url: string);
    collections(): Promise<string[]>;
    collection(collectionName: string): Promise<Collection<any>>;
    save(collectionName: string, item: any, skipInsert?: boolean): Promise<"insert" | "replace">;
    private find;
    findById(collectionName: string, _id: string, projection?: any): Promise<any>;
    findOne(collectionName: string, query: any, projection?: any): Promise<any>;
    findList(collectionName: string, query: any, projection?: any, sort?: Sort, skip?: number, limit?: number): Promise<any[]>;
    count(collectionName: string, query: any): Promise<number>;
    remove(collectionName: string, query: any, multi?: boolean): Promise<number>;
    update(collectionName: string, query: any, updateQuery: any, multi?: boolean): Promise<number>;
    page(collectionName: any, pager: Pager): Promise<Pager>;
    aggregate(collectionName: any, aggs: any[]): Promise<Pager>;
}
