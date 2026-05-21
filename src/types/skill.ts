import { Prisma, SkillCategory } from "@prisma/client";

export { SkillCategory };

export const skillCategories = Object.values(SkillCategory);

export const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

export const availabilityDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type SkillLevel = (typeof skillLevels)[number];
export type AvailabilityDay = (typeof availabilityDays)[number];

export type SkillAvailabilitySlot = {
  day: AvailabilityDay;
  startTime: string;
  endTime: string;
};

export type SkillPayload = {
  title: string;
  description: string;
  category: SkillCategory;
  level: SkillLevel;
  tags?: string[];
  availability?: SkillAvailabilitySlot[];
  price?: number | null;
  creditCost?: number | null;
  isBarter?: boolean;
};

export type SkillUpdatePayload = Partial<SkillPayload>;

export type SkillSearchFilters = {
  search?: string;
  category?: SkillCategory;
  minRating?: number;
  availabilityDay?: AvailabilityDay;
  level?: SkillLevel;
  tag?: string;
  isBarter?: boolean;
  minCreditCost?: number;
  maxCreditCost?: number;
  sortBy?: "newest" | "rating" | "creditCostAsc" | "creditCostDesc";
  limit?: number;
  offset?: number;
};

export const toAvailabilityJson = (
  availability?: SkillAvailabilitySlot[]
): Prisma.JsonArray | undefined => {
  if (!availability) {
    return undefined;
  }

  return availability as unknown as Prisma.JsonArray;
};
