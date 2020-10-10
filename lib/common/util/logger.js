"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const moment = require("moment");
const ansiColors = require("ansi-colors");
class logger {
    static set datetimeFormat(value) {
        if (value)
            this._datetimeFormat = value;
    }
    static set logFormat(value) {
        if (value)
            this._logFormat = value;
    }
    static set level(value) {
        switch (value) {
            case "debug":
                this._level = 0;
                break;
            case "info":
                this._level = 1;
                break;
            case "warn":
                this._level = 2;
                break;
            case "error":
                this._level = 3;
                break;
            default:
                this._level = 0;
        }
    }
    static set setting(aSetting) {
        if (aSetting) {
            this.datetimeFormat = aSetting.datetimeFormat;
            this.logFormat = aSetting.logFormat;
            this.level = aSetting.level;
        }
    }
    static get debugValid() {
        return this._level <= 0;
    }
    static get infoValid() {
        return this._level <= 1;
    }
    static get warnValid() {
        return this._level <= 2;
    }
    static get errorValid() {
        return this._level <= 3;
    }
    static format(level, useAnsiColor, format, ...msgs) {
        if (format.indexOf("datetime") > -1) {
            const nowStr = moment(new Date()).format(this._datetimeFormat);
            format = format.replace(/datetime/, nowStr);
        }
        if (format.indexOf("level") > -1) {
            let levelStr = level;
            if (useAnsiColor) {
                levelStr = this.ansiColorWrapper[level](levelStr);
            }
            format = format.replace(/level/, levelStr);
        }
        if (format.indexOf("position") > -1) {
            const position = new Error().stack.split("\n")[4].trim().replace(/^at /, "");
            format = format.replace(/position/, position);
        }
        let msgsStr = (msgs || []).map(item => {
            if (item instanceof Error) {
                return item.stack;
            }
            else {
                return typeof item === "object" ? JSON.stringify(item, null, 4) : "" + item;
            }
        }).join("\n");
        if (useAnsiColor) {
            msgsStr = this.ansiColorWrapper[level](msgsStr);
        }
        format = format.replace(/message/, msgsStr);
        return format;
    }
    static formatWithoutPos(level, ...msgs) {
        return this.format(level, false, "datetime [level] message", ...msgs);
    }
    static log(level, ...msgs) {
        const logStr = this.format(level, true, this._logFormat, ...msgs);
        console.log(logStr);
    }
    static debug(...msgs) {
        if (this._level <= 0)
            this.log("debug", ...msgs);
    }
    static info(...msgs) {
        if (this._level <= 1)
            this.log("info", ...msgs);
    }
    static warn(...msgs) {
        if (this._level <= 2)
            this.log("warn", ...msgs);
    }
    static error(...msgs) {
        if (this._level <= 3)
            this.log("error", ...msgs);
    }
}
exports.logger = logger;
logger._datetimeFormat = "YYYY-MM-DD HH:mm:ss.SSS";
logger._logFormat = "datetime level position message";
logger._level = 0;
logger.ansiColorWrapper = {
    debug: str => ansiColors.grey(str),
    info: str => ansiColors.cyan(str),
    warn: str => ansiColors.yellow(str),
    error: str => ansiColors.red(str),
};
//# sourceMappingURL=logger.js.map