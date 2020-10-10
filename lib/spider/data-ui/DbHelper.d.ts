export declare class DbHelperUi {
    dbs: string[];
    collections: string[];
    db: string;
    collection: string;
    private searchExpInput;
    readonly defaultSearchExp: string;
    searchExp: any;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    dbList(): Promise<string[]>;
    dbSearch(...args: any[]): Promise<any>;
    dbCollections(db: string): Promise<string[]>;
    loadConnections(): void;
    search(): void;
}
