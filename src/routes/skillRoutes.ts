import express from "express";
import {
  createSkill,
  discoverSkillsController,
  deleteSkill,
  getSkillById,
  getSkills,
  recommendSkill,
  updateSkill
} from "../controllers/skillsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createSkillSchema, updateSkillSchema } from "../validations/skillValidation";

const router = express.Router();

router.get("/discover", discoverSkillsController);
router.get("/", authMiddleware, getSkills);
router.get("/recommendation", authMiddleware, recommendSkill);
router.get("/:skillId", authMiddleware, getSkillById);
router.post("/", authMiddleware, validate(createSkillSchema), createSkill);
router.put("/:skillId", authMiddleware, validate(updateSkillSchema), updateSkill);
router.delete("/:skillId", authMiddleware, deleteSkill);

export default router;
