import { AppConfig, AppInfo, DataUiConfig, DataUiRequestConfig, JobConfig, JobOverrideConfig, OnEventConfig, RequestMappingConfig } from "../Types";
export declare function addJobConfig(config: JobConfig): void;
export declare function addRequestMappingConfig(config: RequestMappingConfig): void;
export declare function addJobOverrideConfig(queueName: string, config: JobOverrideConfig): void;
export declare function addDataUiConfig(config: DataUiConfig): void;
export declare function addDataUiRequestConfig(config: DataUiRequestConfig): void;
export declare function addOnEventConfig(config: OnEventConfig): void;
export declare const appInfo: AppInfo;
export declare function Launcher(appConfig: AppConfig): (target: any) => void;
