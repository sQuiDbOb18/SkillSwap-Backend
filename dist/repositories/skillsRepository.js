"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSkillById = exports.updateSkillById = exports.findSkillByIdAndUser = exports.getSkillsByUser = exports.createSkill = void 0;
const db_1 = __importDefault(require("../config/db"));
const skill_1 = require("../types/skill");
const createSkill = (data) => {
    var _a, _b, _c;
    return db_1.default.skill.create({
        data: {
            ...data,
            tags: (_a = data.tags) !== null && _a !== void 0 ? _a : [],
            availability: (0, skill_1.toAvailabilityJson)(data.availability),
            price: (_b = data.price) !== null && _b !== void 0 ? _b : null,
            isBarter: (_c = data.isBarter) !== null && _c !== void 0 ? _c : false,
        },
    });
};
exports.createSkill = createSkill;
const getSkillsByUser = (userId) => {
    return db_1.default.skill.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};
exports.getSkillsByUser = getSkillsByUser;
const findSkillByIdAndUser = (id, userId) => {
    return db_1.default.skill.findFirst({
        where: { id, userId },
    });
};
exports.findSkillByIdAndUser = findSkillByIdAndUser;
const updateSkillById = (id, data) => {
    const updateData = {
        ...data,
        ...(data.availability !== undefined
            ? { availability: (0, skill_1.toAvailabilityJson)(data.availability) }
            : {}),
    };
    return db_1.default.skill.update({
        where: { id },
        data: updateData,
    });
};
exports.updateSkillById = updateSkillById;
const deleteSkillById = (id) => {
    return db_1.default.skill.delete({
        where: { id },
    });
};
exports.deleteSkillById = deleteSkillById;
