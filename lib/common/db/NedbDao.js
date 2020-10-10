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
const Nedb = require("nedb");
const StringUtil_1 = require("../util/StringUtil");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const DbDao_1 = require("./DbDao");
const __1 = require("../..");
const Persistence = require("nedb/lib/persistence");
const Index = require("nedb/lib/indexes");
const model = require("nedb/lib/model");
const storage = require("nedb/lib/storage");
Persistence.prototype.setAutocompactionInterval = function (interval) {
    this.compactInterval = Math.max(interval || 0, 60000);
};
Persistence.prototype.loadDatabase = function (cb) {
    const callback = cb || function () { };
    const self = this;
    self.db.resetIndexes();
    if (self.inMemoryOnly) {
        return callback(null);
    }
    Persistence.ensureDirectoryExists(path.dirname(self.filename), function (err) {
        if (err) {
            return callback(err);
        }
        storage.ensureDatafileIntegrity(self.filename, function (err) {
            if (err) {
                return callback(err);
            }
            const dataById = new Map();
            const tdata = [];
            const indexes = {};
            const lineBuffer = [];
            let waitReadFinishResolve;
            const waitReadFinishPromise = new Promise(resolve => waitReadFinishResolve = resolve);
            const parseDocs = () => {
                for (let line of lineBuffer) {
                    try {
                        const doc = model.deserialize(self.beforeDeserialization(line));
                        if (doc._id) {
                            if (doc.$$deleted === true) {
                                dataById.delete(doc._id);
                            }
                            else {
                                dataById.set(doc._id, doc);
                            }
                        }
                        else if (doc.$$indexCreated && doc.$$indexCreated.fieldName != undefined) {
                            indexes[doc.$$indexCreated.fieldName] = doc.$$indexCreated;
                        }
                        else if (typeof doc.$$indexRemoved === "string") {
                            delete indexes[doc.$$indexRemoved];
                        }
                    }
                    catch (e) {
                        waitReadFinishResolve(e);
                    }
                }
                lineBuffer.splice(0, lineBuffer.length);
            };
            const reader = readline.createInterface({
                input: fs.createReadStream(self.filename).setEncoding('utf8')
            });
            reader.on('line', function (line) {
                lineBuffer.push(line);
                lineBuffer.length >= 10000 && parseDocs();
            });
            reader.on('close', function (line) {
                lineBuffer.length > 0 && parseDocs();
                waitReadFinishResolve();
            });
            waitReadFinishPromise.then(err => {
                if (err) {
                    reader.close();
                    return callback(err);
                }
                for (let item of dataById.values()) {
                    tdata.push(item);
                }
                dataById.clear();
                const treatedData = { data: tdata, indexes: indexes };
                Object.keys(treatedData.indexes).forEach(function (key) {
                    self.db.indexes[key] = new Index(treatedData.indexes[key]);
                });
                try {
                    self.db.resetIndexes(treatedData.data);
                }
                catch (e) {
                    self.db.resetIndexes();
                    return cb(e);
                }
                self.db.executor.processBuffer();
                cb();
            });
        });
    });
};
const treeVisitor = (node, callback) => {
    let shouldContinue;
    node.left && (shouldContinue = treeVisitor(node.left, callback));
    if (shouldContinue === false) {
        return shouldContinue;
    }
    shouldContinue = callback(node);
    if (shouldContinue === false) {
        return shouldContinue;
    }
    node.right && (shouldContinue = treeVisitor(node.right, callback));
    return shouldContinue;
};
Persistence.prototype.persistCachedDatabase = function (cb) {
    const callback = cb || function () { };
    const self = this;
    if (self.inMemoryOnly) {
        return callback(null);
    }
    const tempFilename = self.filename + '~';
    const writeToTempFile = () => {
        const lineBuffer = [];
        let writeErr;
        let waitFinishResolve;
        let waitFinishPromise;
        const writer = fs.createWriteStream(tempFilename, "utf-8");
        const writeLines = () => __awaiter(this, void 0, void 0, function* () {
            if (lineBuffer.length) {
                waitFinishPromise && (yield waitFinishPromise);
                waitFinishPromise = new Promise(resolve => waitFinishResolve = resolve);
                writer.write(lineBuffer.join("\n") + "\n", err => {
                    if (err) {
                        writeErr = err;
                    }
                    waitFinishResolve();
                });
                lineBuffer.splice(0, lineBuffer.length);
            }
        });
        treeVisitor(self.db.indexes._id.tree.tree, node => {
            if (writeErr) {
                return false;
            }
            for (let i = 0, len = node.data.length; i < len; i += 1) {
                const doc = node.data[i];
                lineBuffer.push(self.afterSerialization(model.serialize(doc)));
                lineBuffer.length >= 100 && writeLines();
            }
        });
        for (let fieldName of Object.keys(self.db.indexes)) {
            if (fieldName != "_id") {
                lineBuffer.push(self.afterSerialization(model.serialize({ $$indexCreated: { fieldName: fieldName, unique: self.db.indexes[fieldName].unique, sparse: self.db.indexes[fieldName].sparse } })));
                lineBuffer.length >= 100 && writeLines();
            }
        }
        lineBuffer.length > 0 && writeLines();
        if (writeErr) {
            return callback(writeErr);
        }
        const rename = () => {
            storage.flushToStorage(tempFilename, err => {
                if (err) {
                    return callback(err);
                }
                fs.rename(tempFilename, self.filename, err1 => {
                    if (err1) {
                        return callback(err1);
                    }
                    storage.flushToStorage({ filename: path.dirname(self.filename), isDir: true }, err2 => {
                        if (!err2) {
                            self.db.emit('compaction.done');
                        }
                        callback(err2);
                    });
                });
            });
        };
        if (waitFinishPromise) {
            waitFinishPromise.then(() => {
                if (writeErr) {
                    return callback(writeErr);
                }
                writer.close();
                rename();
            });
        }
        else {
            writer.close();
            rename();
        }
    };
    storage.flushToStorage({ filename: path.dirname(self.filename), isDir: true }, err => {
        if (err) {
            return callback(err);
        }
        if (fs.existsSync(self.filename)) {
            storage.flushToStorage(self.filename, function (err) {
                if (err) {
                    callback(err);
                }
                else
                    writeToTempFile();
            });
        }
        else {
            writeToTempFile();
        }
    });
};
class NedbDao extends DbDao_1.DbDao {
    constructor(url) {
        super(url);
        this.nedbs = {};
        const ps = [];
        this.nedbDir = url.substring("nedb;//".length);
        __1.FileUtil.mkdirs(this.nedbDir);
        const files = fs.readdirSync(this.nedbDir);
        for (let file of files) {
            if (file.endsWith(".collection")) {
                const collectionName = file.substring(0, file.length - 11);
                ps.push(this.collection(collectionName));
            }
        }
        Promise.all(ps).then(results => {
            this.dbResolve(this.nedbs);
        });
    }
    castRegexInMatch(query) {
        if (query == null)
            return query;
        if (query instanceof Array) {
            for (let i = 0, len = query.length; i < len; i++) {
                query[i] = this.castRegexInMatch(query[i]);
            }
        }
        else if (typeof query == "object") {
            for (let key of Object.keys(query)) {
                if (key == "$regex") {
                    query[key] = new RegExp(query[key]);
                }
                else
                    query[key] = this.castRegexInMatch(query[key]);
            }
        }
        return query;
    }
    collections() {
        return new Promise((resolve, reject) => {
            this.dbPromise.then(nedbs => {
                resolve(Object.keys(nedbs));
            });
        });
    }
    collection(collectionName) {
        let nedbP = this.nedbs[collectionName];
        if (!nedbP) {
            this.nedbs[collectionName] = nedbP = new Promise((resolve, reject) => {
                const collectionPath = this.nedbDir + (this.nedbDir.endsWith("/") ? "" : "/") + collectionName + ".collection";
                __1.logger.info(`load nedb collection(${collectionName}) from ${collectionPath}`);
                const nedb = new Nedb({
                    filename: collectionPath,
                    autoload: false
                });
                nedb.loadDatabase(res => {
                    if (res) {
                        reject(new Error("nedb loading failed: " + collectionPath));
                    }
                    else {
                        nedb.addListener("compaction.done", () => {
                            const compactInterval = nedb.persistence["compactInterval"];
                            if (compactInterval) {
                                setTimeout(() => nedb.persistence.compactDatafile(), compactInterval);
                            }
                        });
                        resolve(nedb);
                        __1.logger.info(`load nedb collection(${collectionName}) successfully`);
                    }
                });
            });
        }
        return nedbP;
    }
    save(collectionName, item, skipInsert = false) {
        return new Promise((resolve, reject) => {
            if (item._id == null) {
                item._id = StringUtil_1.StringUtil.id();
            }
            this.collection(collectionName).then(nedb => {
                if (skipInsert) {
                    nedb.update({ _id: item._id }, item, {}, err1 => {
                        __1.PromiseUtil.rejectOrResolve(reject, err1, resolve, "replace");
                    });
                }
                else {
                    nedb.insert(item, (err) => {
                        if (err) {
                            if (err.errorType == "uniqueViolated") {
                                nedb.update({ _id: item._id }, item, {}, err1 => {
                                    __1.PromiseUtil.rejectOrResolve(reject, err1, resolve, "replace");
                                });
                            }
                            else {
                                reject(err);
                            }
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
            query = this.castRegexInMatch(query || {});
            if (!projection) {
                projection = {};
            }
            this.collection(collectionName).then(nedb => {
                if (justOne) {
                    nedb.findOne(query, projection, (error, doc) => {
                        __1.PromiseUtil.rejectOrResolve(reject, error, resolve, doc);
                    });
                }
                else {
                    const cursor = nedb.find(query, projection);
                    if (sort) {
                        let sortKeyNum = 0;
                        for (let key of Object.keys(sort)) {
                            if (typeof sort[key] != "number") {
                                delete sort[key];
                            }
                            else {
                                sortKeyNum++;
                            }
                        }
                        if (sortKeyNum > 0) {
                            cursor.sort(sort);
                        }
                    }
                    if (typeof skip == "number") {
                        cursor.skip(skip);
                    }
                    if (typeof limit == "number") {
                        cursor.limit(limit);
                    }
                    cursor.exec((error, docs) => {
                        __1.PromiseUtil.rejectOrResolve(reject, error, resolve, docs);
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
            query = this.castRegexInMatch(query || {});
            this.collection(collectionName).then(nedb => {
                nedb.count(query, (error, num) => {
                    __1.PromiseUtil.rejectOrResolve(reject, error, resolve, num);
                });
            });
        });
    }
    remove(collectionName, query, multi = true) {
        return new Promise((resolve, reject) => {
            query = this.castRegexInMatch(query || {});
            this.collection(collectionName).then(nedb => {
                nedb.remove(query, {
                    multi: multi
                }, (error, num) => {
                    __1.PromiseUtil.rejectOrResolve(reject, error, resolve, num);
                });
            });
        });
    }
    update(collectionName, query, updateQuery, multi = true) {
        return new Promise((resolve, reject) => {
            query = this.castRegexInMatch(query || {});
            this.collection(collectionName).then(nedb => {
                nedb.update(query, updateQuery, { multi: multi }, (error, num) => {
                    __1.PromiseUtil.rejectOrResolve(reject, error, resolve, num);
                });
            });
        });
    }
    page(collectionName, pager) {
        return new Promise((resolve, reject) => {
            const query = this.castRegexInMatch(pager.match || {});
            this.collection(collectionName).then((nedb) => __awaiter(this, void 0, void 0, function* () {
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
}
exports.NedbDao = NedbDao;
//# sourceMappingURL=NedbDao.js.map