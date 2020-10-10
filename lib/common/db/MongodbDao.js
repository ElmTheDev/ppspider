"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const PromiseUtil_1 = require("../util/PromiseUtil");
const StringUtil_1 = require("../util/StringUtil");
const DbDao_1 = require("./DbDao");
const mongodb_1 = require("mongodb");
const url_1 = require("url");
class MongodbDao extends DbDao_1.DbDao {
    constructor(url) {
        super(url);
        const urlObj = new url_1.URL(url);
        const pathSplit = urlObj.pathname.split("/").filter(item => !!item);
        if (pathSplit.length != 1) {
            throw new Error("bad mongodb url which should end with the db name");
        }
        this.dbName = pathSplit[0];
        mongodb_1.MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
            if (err) {
                throw err;
            }
            else {
                this.dbResolve(client.db(this.dbName));
            }
        });
    }
    collections() {
        return new Promise((resolve, reject) => {
            this.dbPromise.then((db) => {
                db.collections().then(res => {
                    const collectionNames = res.map(item => item.collectionName);
                    resolve(collectionNames);
                }).catch(err => reject(err));
            });
        });
    }
    collection(collectionName) {
        return this.dbPromise.then((db) => db.collection(collectionName));
    }
    save(collectionName, item, skipInsert = false) {
        return new Promise((resolve, reject) => {
            if (item._id == null) {
                item._id = StringUtil_1.StringUtil.id();
            }
            this.dbPromise.then((db) => {
                const collection = db.collection(collectionName);
                if (skipInsert) {
                    collection.replaceOne({ _id: item._id }, item, err => {
                        PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, err, resolve, "replace");
                    });
                }
                else {
                    collection.insertOne(item, err => {
                        if (err) {
                            collection.replaceOne({ _id: item._id }, item, err => {
                                PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, err, resolve, "replace");
                            });
                        }
                        else {
                            resolve("insert");
                        }
                    });
                }
            });
        });
    }
    find(collectionName, query, projection, justOne, sort, skip, limit) {
        return new Promise((resolve, reject) => {
            if (!projection) {
                projection = {};
            }
            this.dbPromise.then((db) => {
                const collection = db.collection(collectionName);
                if (justOne) {
                    collection.findOne(query, {
                        projection: projection
                    }, (error, doc) => {
                        PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, error, resolve, doc);
                    });
                }
                else {
                    const aggOpt = [];
                    aggOpt.push({ $match: query || {} });
                    sort && aggOpt.push({ $sort: sort });
                    projection && Object.keys(projection).length > 0 && aggOpt.push({ $project: projection });
                    skip && aggOpt.push({ $skip: skip });
                    limit && aggOpt.push({ $limit: limit });
                    collection.aggregate(aggOpt, { allowDiskUse: true }).toArray((err, docs) => {
                        PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, err, resolve, docs);
                    });
                }
            });
        });
    }
    findById(collectionName, _id, projection) {
        return this.find(collectionName, { _id: _id }, projection, true);
    }
    findOne(collectionName, query, projection) {
        return this.find(collectionName, query, projection, true);
    }
    findList(collectionName, query, projection, sort, skip, limit) {
        return this.find(collectionName, query, projection, false, sort, skip, limit);
    }
    count(collectionName, query) {
        return new Promise((resolve, reject) => {
            this.dbPromise.then((db) => {
                const collection = db.collection(collectionName);
                collection.countDocuments(query, (error, num) => {
                    PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, error, resolve, num);
                });
            });
        });
    }
    remove(collectionName, query, multi = true) {
        return new Promise((resolve, reject) => {
            this.dbPromise.then((db) => {
                const collection = db.collection(collectionName);
                collection[multi ? "deleteMany" : "deleteOne"](query, (error, result) => {
                    PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, error, resolve, result && result.result ? result.result.n : 0);
                });
            });
        });
    }
    update(collectionName, query, updateQuery, multi = true) {
        return new Promise((resolve, reject) => {
            this.dbPromise.then((db) => {
                const collection = db.collection(collectionName);
                collection[multi ? "updateMany" : "updateOne"](query, updateQuery, (error, result) => {
                    PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, error, resolve, result);
                });
            });
        });
    }
    page(collectionName, pager) {
        return new Promise((resolve, reject) => {
            const query = pager.match || {};
            this.dbPromise.then((db) => __awaiter(this, void 0, void 0, function* () {
                let total;
                try {
                    total = yield this.count(collectionName, query);
                }
                catch (e) {
                    return reject(e);
                }
                const pageSize = pager.pageSize || 10;
                const pageIndex = Math.min(pager.pageIndex || 0, parseInt("" + Math.max(total - 1, 0) / pageSize));
                let list;
                try {
                    list = yield this.findList(collectionName, query, pager.projection || {}, pager.sort, pageIndex * pageSize, pageSize);
                }
                catch (e) {
                    return reject(e);
                }
                pager.pageIndex = pageIndex;
                pager.total = total;
                pager.list = list;
                resolve(pager);
            }));
        });
    }
    aggregate(collectionName, aggs) {
        return new Promise((resolve, reject) => {
            this.dbPromise.then((db) => __awaiter(this, void 0, void 0, function* () {
                const collection = db.collection(collectionName);
                collection.aggregate(aggs, { allowDiskUse: true }).toArray((err, docs) => {
                    PromiseUtil_1.PromiseUtil.rejectOrResolve(reject, err, resolve, docs);
                });
            }));
        });
    }
}
exports.MongodbDao = MongodbDao;
//# sourceMappingURL=MongodbDao.js.map