import express from "express";
import {
  createSkill,
  deleteSavedSkillSearchController,
  discoverSkillsController,
  deleteSkill,
  favoriteSkillController,
  getFavoriteSkillsController,
  getSavedSkillSearchesController,
  getSkillById,
  getSkillSearchHistoryController,
  getSkills,
  recommendSkill,
  saveSkillSearchController,
  unfavoriteSkillController,
  updateSkill
} from "../controllers/skillsController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createSkillSchema, saveSkillSearchSchema, updateSkillSchema } from "../validations/skillValidation";

const router = express.Router();

router.get("/discover", optionalAuthMiddleware, discoverSkillsController);
router.get("/", authMiddleware, getSkills);
router.get("/recommendation", authMiddleware, recommendSkill);
router.get("/favorites", authMiddleware, getFavoriteSkillsController);
router.get("/search-history", authMiddleware, getSkillSearchHistoryController);
router.get("/saved-searches", authMiddleware, getSavedSkillSearchesController);
router.post("/saved-searches", authMiddleware, validate(saveSkillSearchSchema), saveSkillSearchController);
router.delete("/saved-searches/:savedSearchId", authMiddleware, deleteSavedSkillSearchController);
router.post("/:skillId/favorite", authMiddleware, favoriteSkillController);
router.delete("/:skillId/favorite", authMiddleware, unfavoriteSkillController);
router.get("/:skillId", authMiddleware, getSkillById);
router.post("/", authMiddleware, validate(createSkillSchema), createSkill);
router.put("/:skillId", authMiddleware, validate(updateSkillSchema), updateSkill);
router.delete("/:skillId", authMiddleware, deleteSkill);

export default router;
