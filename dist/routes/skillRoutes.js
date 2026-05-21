"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const skillsController_1 = require("../controllers/skillsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = require("../middleware/validate");
const skillValidation_1 = require("../validations/skillValidation");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.authMiddleware, skillsController_1.getSkills);
router.get("/recommendation", authMiddleware_1.authMiddleware, skillsController_1.recommendSkill);
router.get("/:skillId", authMiddleware_1.authMiddleware, skillsController_1.getSkillById);
router.post("/", authMiddleware_1.authMiddleware, (0, validate_1.validate)(skillValidation_1.createSkillSchema), skillsController_1.createSkill);
router.put("/:skillId", authMiddleware_1.authMiddleware, (0, validate_1.validate)(skillValidation_1.updateSkillSchema), skillsController_1.updateSkill);
router.delete("/:skillId", authMiddleware_1.authMiddleware, skillsController_1.deleteSkill);
exports.default = router;
