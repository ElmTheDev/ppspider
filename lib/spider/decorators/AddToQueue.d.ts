import { AddToQueueConfig, AddToQueueInfo } from "../Types";
export declare function transformResToAddToQueueInfos(method: Function, res: any): AddToQueueInfo[];
export declare function AddToQueue(queueConfigs: AddToQueueConfig | AddToQueueConfig[]): (target: any, key: any, descriptor: any) => any;
