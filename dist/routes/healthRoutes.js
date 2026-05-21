"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const healthController_1 = require("../controllers/healthController");
const router = express_1.default.Router();
router.get("/health", healthController_1.healthCheck);
router.get("/ready", healthController_1.readinessCheck);
exports.default = router;
