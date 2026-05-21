"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const chatSocket_1 = require("./socket/chatSocket");
const PORT = Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 4000);
const HOST = (_b = process.env.HOST) !== null && _b !== void 0 ? _b : "0.0.0.0";
const server = (0, http_1.createServer)(app_1.default);
(0, chatSocket_1.initializeSocketServer)(server);
server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
