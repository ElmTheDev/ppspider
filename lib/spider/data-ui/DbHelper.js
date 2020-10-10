"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const DataUi_1 = require("../decorators/DataUi");
const Bean_1 = require("../../common/bean/Bean");
const DbDao_1 = require("../../common/db/DbDao");
let DbHelperUi = class DbHelperUi {
    constructor() {
        this.dbs = [];
        this.collections = [];
        this.defaultSearchExp = `{
  "pageIndex": 0,
  "pageSize": 10,
  "match": {
      
  },
  "projection": {
    
  },
  "sort": {
    "_id": 1
  }
}
`;
        this.searchExp = JSON.parse(this.defaultSearchExp);
    }
    ngOnInit() {
        this.dbList().then(res => {
            res.forEach(item => this.dbs.push(item));
            this.db = this.dbs[0];
            this.loadConnections();
        });
    }
    ngAfterViewInit() {
        this.searchExpInput = CodeMirror.fromTextArea(document.getElementById("searchExp"), {
            matchBrackets: true,
            autoCloseBrackets: true,
            mode: "application/ld+json",
            lineWrapping: true,
            lineNumbers: true,
            lineHeight: "20px"
        });
        this.searchExpInput.on('change', (cm, change) => {
            const value = cm.getValue();
            try {
                this.searchExp = JSON.parse(value);
            }
            catch (e) {
                this.searchExp = null;
            }
        });
    }
    dbList() {
        return null;
    }
    dbSearch(...args) {
        return null;
    }
    dbCollections(db) {
        return null;
    }
    loadConnections() {
        if (this.db) {
            this.dbCollections(this.db).then(res => {
                this.collections = res.sort();
                this.collection = this.collections[0];
            });
        }
        else {
            this.collections = [];
            this.collection = null;
        }
    }
    search() {
        if (this.db && this.collection && this.searchExp) {
            this.dbSearch(this.db, this.collection, this.searchExp).then(res => {
                $("#searchResultViewer").jsonViewer(res, { collapsed: false });
                $("#searchResultViewer a.json-string").attr("target", "_blank");
            });
        }
    }
};
DbHelperUi = __decorate([
    DataUi_1.DataUi({
        label: "Db Helper",
        style: `
#searchResultViewer {
    overflow-y: auto;
    max-height: calc(100vh - 90px);
    margin-top: 18px;
}
    `,
        template: `
        <div class="container-fluid" style="margin-top: 12px">
            <div class="row">
                <div class="col-sm-3">
                    <form>
                        <div class="form-group">
                            <label for="db">Db</label>
                            <select [(ngModel)]="db" (change)="loadConnections()" id="db" name="db" class="form-control">
                                <option *ngFor="let db of dbs" [ngValue]="db">{{db}}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="db">Collection</label>
                            <select [(ngModel)]="collection" id="collection" name="collection" class="form-control">
                                <option *ngFor="let item of collections" [ngValue]="item">{{item}}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="searchExp">Search Exp</label>
                            <textarea id="searchExp" name="searchExp" class="form-control" rows="15">{{defaultSearchExp}}</textarea>
                        </div>
                        <button (click)="search()" [disabled]="db && collection && searchExp ? null : true" class="btn btn-primary">Submit</button>
                    </form>
                </div>
                <div class="col-sm-9">
                    <div id="searchResultViewer"></div>
                </div>
            </div>
        </div>
    `
    })
], DbHelperUi);
exports.DbHelperUi = DbHelperUi;
let DbHelper = class DbHelper {
    dbList() {
        return DbDao_1.DbDao.dbs();
    }
    dbCollections(db) {
        return DbDao_1.DbDao.db(db).collections();
    }
    dbSearch(db, collection, searchExp) {
        return DbDao_1.DbDao.db(db).page(collection, searchExp);
    }
};
__decorate([
    DataUi_1.DataUiRequest(DbHelperUi.prototype.dbList),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DbHelper.prototype, "dbList", null);
__decorate([
    DataUi_1.DataUiRequest(DbHelperUi.prototype.dbCollections),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DbHelper.prototype, "dbCollections", null);
__decorate([
    DataUi_1.DataUiRequest(DbHelperUi.prototype.dbSearch),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, DbDao_1.Pager]),
    __metadata("design:returntype", void 0)
], DbHelper.prototype, "dbSearch", null);
DbHelper = __decorate([
    Bean_1.Bean()
], DbHelper);
//# sourceMappingURL=DbHelper.js.map