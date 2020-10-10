import { DataUiConfig } from "../Types";
export declare function DataUi(config: DataUiConfig): (target: any) => void;
export declare function DataUiRequest(method: (...args: any[]) => any): (target: any, key: any, descriptor: any) => any;
