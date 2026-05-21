"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendSkill = exports.deleteSkill = exports.updateSkill = exports.getSkillById = exports.getSkills = exports.createSkill = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const skillService_1 = require("../services/skillService");
exports.createSkill = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const skill = await (0, skillService_1.addSkill)(req.user.userId, req.body);
    res.status(201).json(skill);
});
exports.getSkills = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const skills = await (0, skillService_1.getUserSkills)(req.user.userId);
    res.json(skills);
});
exports.getSkillById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const skill = await (0, skillService_1.getUserSkillById)(req.user.userId, req.params.skillId);
    res.json(skill);
});
exports.updateSkill = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const skill = await (0, skillService_1.updateUserSkill)(req.user.userId, req.params.skillId, req.body);
    res.json(skill);
});
exports.deleteSkill = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, skillService_1.removeUserSkill)(req.user.userId, req.params.skillId);
    res.json(result);
});
exports.recommendSkill = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const recommendation = await (0, skillService_1.getSkillRecommendation)(req.user.userId);
    res.json(recommendation);
});
