import {Page as PageInterface} from "puppeteer-core";

// 优化Page的引入方式，使得编辑器可以正常提示
exports.Page = require("puppeteer-core/lib/Page").Page;
export declare interface Page extends PageInterface {}
export declare abstract class Page implements PageInterface {}
