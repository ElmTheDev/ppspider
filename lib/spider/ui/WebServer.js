"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const logger_1 = require("../../common/util/logger");
class WebServer {
    constructor(port, workplace, requestMappingConfigs, onRequestCallback) {
        this.port = port;
        this.webRoot = __dirname + "/web";
        if (this.http != null)
            return;
        const express = require("express");
        const app = express();
        app.use(bodyParser.json({ limit: '10mb' }));
        app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
        app.use(express.static(this.webRoot));
        app.use(express.static(workplace));
        {
            const requestMappingRouter = express.Router();
            requestMappingConfigs.forEach(config => {
                const tempHandler = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const target = config.target;
                        const method = target[config.method];
                        yield method.call(target, req, res, next);
                    }
                    catch (e) {
                        logger_1.logger.warn(e);
                    }
                });
                if (config.httpMethod == "" || config.httpMethod == "GET") {
                    requestMappingRouter.get(config.url, tempHandler);
                }
                if (config.httpMethod == "" || config.httpMethod == "POST") {
                    requestMappingRouter.post(config.url, tempHandler);
                }
            });
            app.use("/", requestMappingRouter);
        }
        this.http = require("http").Server(app);
        this.io = require("socket.io").listen(this.http);
        this.io.on("connection", socket => {
            socket.on("request", (req) => __awaiter(this, void 0, void 0, function* () {
                const res = yield onRequestCallback(req);
                socket.emit("response_" + req.id, res);
            }));
            socket.on("error", (error) => {
                if (error) {
                    logger_1.logger.warn("socket error", error);
                }
            });
        });
        this.http.listen(port, () => {
            logger_1.logger.info("The web ui server started successfully, have a look at http://localhost:" + port);
        });
    }
    push(key, data) {
        this.io.clients().emit("push_" + key, data);
    }
    shutdown() {
        this.http.close();
        this.io.close();
        logger_1.logger.info("The web ui server stopped");
    }
}
exports.WebServer = WebServer;
//# sourceMappingURL=WebServer.js.map