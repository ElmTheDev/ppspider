"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const readline = require("readline");
class FileUtil {
    static mkdirs(pathStr) {
        if (!pathStr)
            return false;
        try {
            if (!fs.existsSync(pathStr)) {
                fs.mkdirSync(pathStr, { recursive: true });
            }
        }
        catch (e) {
            console.warn(e.stack);
            return false;
        }
        return true;
    }
    static parent(pathStr) {
        pathStr = pathStr.replace("\\", "/");
        const dir = path.dirname(pathStr);
        if (dir != pathStr) {
            return dir;
        }
        else
            return "";
    }
    static write(pathStr, content, charset) {
        try {
            if (this.mkdirs(this.parent(pathStr))) {
                const options = charset ? {
                    encoding: charset
                } : "utf-8";
                if (content instanceof Array) {
                    const lines = content;
                    fs.writeFileSync(pathStr, "", options);
                    for (let i = 0, len = lines.length; i < len; i += 100) {
                        const subLines = lines.slice(i, i + 100).join("\n") + "\n";
                        fs.appendFileSync(pathStr, subLines, options);
                    }
                }
                else {
                    fs.writeFileSync(pathStr, content, options);
                }
                return true;
            }
        }
        catch (e) {
            console.warn(e.stack);
        }
        return false;
    }
    static read(pathStr, charset = "utf-8") {
        try {
            if (fs.existsSync(pathStr)) {
                return fs.readFileSync(pathStr, {
                    encoding: charset
                });
            }
        }
        catch (e) {
            console.warn(e.stack);
        }
        return null;
    }
    static readLines(file, charset = "utf-8") {
        return new Promise(resolve => {
            const lines = [];
            const reader = readline.createInterface({
                input: fs.createReadStream(file).setEncoding(charset)
            });
            reader.on('line', function (line) {
                lines.push(line);
            });
            reader.on('close', function (line) {
                resolve(lines);
            });
        });
    }
}
exports.FileUtil = FileUtil;
//# sourceMappingURL=FileUtil.js.map