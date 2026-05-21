"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const skillRoutes_1 = __importDefault(require("./routes/skillRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (_b = (_a = process.env.CLIENT_URL) === null || _a === void 0 ? void 0 : _a.split(",")) !== null && _b !== void 0 ? _b : true,
    credentials: true
}));
app.use(express_1.default.json());
app.use("/api/auth", authRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/skills", skillRoutes_1.default);
app.use("/api/bookings", bookingRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Skillswap API is running...");
});
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
