import { asyncHandler } from "../utils/asyncHandler";
import {
  addSkill,
  discoverSkills,
  getUserSkillById,
  getSkillRecommendation,
  getUserSkills,
  removeUserSkill,
  updateUserSkill
} from "../services/skillService";
import { discoverSkillsQuerySchema } from "../validations/skillValidation";

export const createSkill = asyncHandler(async (req: any, res: any) => {
  const skill = await addSkill(req.user.userId, req.body);

  res.status(201).json(skill);
});

export const getSkills = asyncHandler(async (req: any, res: any) => {
  const skills = await getUserSkills(req.user.userId);
  res.json(skills);
});

export const discoverSkillsController = asyncHandler(async (req: any, res: any) => {
  const query = discoverSkillsQuerySchema.parse(req.query);
  const skills = await discoverSkills(query);
  res.json(skills);
});

export const getSkillById = asyncHandler(async (req: any, res: any) => {
  const skill = await getUserSkillById(req.user.userId, req.params.skillId);
  res.json(skill);
});

export const updateSkill = asyncHandler(async (req: any, res: any) => {
  const skill = await updateUserSkill(req.user.userId, req.params.skillId, req.body);
  res.json(skill);
});

export const deleteSkill = asyncHandler(async (req: any, res: any) => {
  const result = await removeUserSkill(req.user.userId, req.params.skillId);
  res.json(result);
});

export const recommendSkill = asyncHandler(async (req: any, res: any) => {
  const recommendation = await getSkillRecommendation(req.user.userId);
  res.json(recommendation);
});
