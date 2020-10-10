import { WorkerFactory } from "./WorkerFactory";
export declare class NoneWorkerFactory implements WorkerFactory<any> {
    workerType(): any;
    get(): Promise<any>;
    release(worker: any): Promise<void>;
    shutdown(): void;
}
