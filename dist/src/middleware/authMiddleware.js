"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const userRepository_1 = require("../repositories/userRepository");
const authToken_1 = require("../utils/authToken");
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decoded = (0, authToken_1.verifyAccessToken)(token);
        const user = await (0, userRepository_1.findUserForAuthById)(decoded.userId);
        if (!user || user.deletedAt) {
            return res.status(401).json({ message: "Account is no longer active" });
        }
        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
