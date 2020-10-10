export declare class CronUtil {
    private static readonly crons;
    private static getCronJob;
    static next(cron: string, num?: number): Date[];
    static prev(cron: string, now?: number): Date;
    static setInterval(cron: string, func: Function): {
        cron: string;
        callback: Function;
        clear: Function;
    };
    static removeInterval(cron: string, func?: Function): void;
}
