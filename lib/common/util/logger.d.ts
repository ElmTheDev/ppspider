import "source-map-support/register";
export declare type LoggerSetting = {
    datetimeFormat?: "YYYY-MM-DD HH:mm:ss.SSS" | string;
    logFormat?: "datetime [level] position message" | string;
    level?: "debug" | "info" | "warn" | "error" | string;
};
export declare class logger {
    private static _datetimeFormat;
    private static _logFormat;
    private static _level;
    static set datetimeFormat(value: string);
    static set logFormat(value: string);
    static set level(value: "debug" | "info" | "warn" | "error" | string);
    static set setting(aSetting: LoggerSetting);
    static get debugValid(): boolean;
    static get infoValid(): boolean;
    static get warnValid(): boolean;
    static get errorValid(): boolean;
    private static ansiColorWrapper;
    static format(level: "debug" | "info" | "warn" | "error" | string, useAnsiColor: boolean, format: string, ...msgs: any[]): string;
    static formatWithoutPos(level: "debug" | "info" | "warn" | "error", ...msgs: any[]): string;
    private static log;
    static debug(...msgs: any[]): void;
    static info(...msgs: any[]): void;
    static warn(...msgs: any[]): void;
    static error(...msgs: any[]): void;
}
