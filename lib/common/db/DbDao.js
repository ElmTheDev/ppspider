"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Pager {
    constructor() {
        this.pageIndex = 0;
        this.pageSize = 10;
        this.match = {};
    }
}
exports.Pager = Pager;
class DbDao {
    constructor(url) {
        if (DbDao._instances[url]) {
            throw new Error(`db(${url}) existed`);
        }
        this.url = url;
        DbDao._instances[this.url] = this;
        this.dbPromise = new Promise(resolve => {
            this.dbResolve = resolve;
        });
    }
    static dbs() {
        return Object.keys(DbDao._instances);
    }
    static db(dbName) {
        return DbDao._instances[dbName];
    }
    waitReady() {
        return this.dbPromise;
    }
    collections() {
        throw new Error("collections is not implemented");
    }
    collection(collectionName) {
        throw new Error("collection is not implemented");
    }
    save(collectionName, item, skipInsert = false) {
        throw new Error("save is not implemented");
    }
    findById(collectionName, _id, projection) {
        throw new Error("findById is not implemented");
    }
    findOne(collectionName, query, projection) {
        throw new Error("findOne is not implemented");
    }
    findList(collectionName, query, projection, sort, skip, limit) {
        throw new Error("findList is not implemented");
    }
    count(collectionName, query) {
        throw new Error("count is not implemented");
    }
    remove(collectionName, query, multi = true) {
        throw new Error("remove is not implemented");
    }
    update(collectionName, query, updateQuery, multi = true) {
        throw new Error("update is not implemented");
    }
    page(collectionName, pager) {
        throw new Error("page is not implemented");
    }
}
exports.DbDao = DbDao;
DbDao._instances = {};
//# sourceMappingURL=DbDao.js.map