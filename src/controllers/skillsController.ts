import { asyncHandler } from "../utils/asyncHandler";
import {
  addSkill,
  deleteSavedSkillSearch,
  discoverSkills,
  favoriteSkill,
  getFavoriteSkills,
  getSavedSkillSearches,
  getSkillSearchHistory,
  getUserSkillById,
  getSkillRecommendation,
  getUserSkills,
  removeUserSkill,
  saveSkillSearch,
  unfavoriteSkill,
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
  const skills = req.user?.userId
    ? await discoverSkills(query, req.user.userId)
    : await discoverSkills(query);
  res.json(skills);
});

export const favoriteSkillController = asyncHandler(async (req: any, res: any) => {
  const favorite = await favoriteSkill(req.user.userId, req.params.skillId);
  res.status(201).json(favorite);
});

export const unfavoriteSkillController = asyncHandler(async (req: any, res: any) => {
  const result = await unfavoriteSkill(req.user.userId, req.params.skillId);
  res.json(result);
});

export const getFavoriteSkillsController = asyncHandler(async (req: any, res: any) => {
  const favorites = await getFavoriteSkills(req.user.userId);
  res.json(favorites);
});

export const getSkillSearchHistoryController = asyncHandler(async (req: any, res: any) => {
  const history = await getSkillSearchHistory(req.user.userId);
  res.json(history);
});

export const saveSkillSearchController = asyncHandler(async (req: any, res: any) => {
  const savedSearch = await saveSkillSearch(req.user.userId, req.body);
  res.status(201).json(savedSearch);
});

export const getSavedSkillSearchesController = asyncHandler(async (req: any, res: any) => {
  const savedSearches = await getSavedSkillSearches(req.user.userId);
  res.json(savedSearches);
});

export const deleteSavedSkillSearchController = asyncHandler(async (req: any, res: any) => {
  const result = await deleteSavedSkillSearch(req.user.userId, req.params.savedSearchId);
  res.json(result);
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
