"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAvailabilityJson = exports.availabilityDays = exports.skillLevels = exports.skillCategories = exports.SkillCategory = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "SkillCategory", { enumerable: true, get: function () { return client_1.SkillCategory; } });
exports.skillCategories = Object.values(client_1.SkillCategory);
exports.skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
exports.availabilityDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];
const toAvailabilityJson = (availability) => {
    if (!availability) {
        return undefined;
    }
    return availability;
};
exports.toAvailabilityJson = toAvailabilityJson;
