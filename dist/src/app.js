"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const requestLogger_1 = require("./middleware/requestLogger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const skillRoutes_1 = __importDefault(require("./routes/skillRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const app = (0, express_1.default)();
const apiV1Router = express_1.default.Router();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL?.split(",") ?? true,
    credentials: true
}));
app.use(requestLogger_1.requestLogger);
app.use(express_1.default.json());
apiV1Router.use("/auth", authRoutes_1.default);
apiV1Router.use("/user", userRoutes_1.default);
apiV1Router.use("/skills", skillRoutes_1.default);
apiV1Router.use("/bookings", bookingRoutes_1.default);
apiV1Router.use("/messages", messageRoutes_1.default);
apiV1Router.use("/reviews", reviewRoutes_1.default);
apiV1Router.use("/notifications", notificationRoutes_1.default);
apiV1Router.use("/wallet", walletRoutes_1.default);
apiV1Router.use("/reports", reportRoutes_1.default);
apiV1Router.use("/admin", adminRoutes_1.default);
app.use("/api/v1", apiV1Router);
app.use("/api", apiV1Router);
app.get("/", (req, res) => {
    res.send("Skillswap API is running...");
});
app.use(notFound_1.notFoundHandler);
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
