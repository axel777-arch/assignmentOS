export type RequirementStatus = "not_checked" | "met" | "partial" | "missing";
export type RequirementKind = "concept" | "section" | "length" | "sources" | "deadline";
export type RequirementRecord = { id: string; text: string; kind: RequirementKind; status: RequirementStatus; evidence?: string };
export type AssignmentRecord = { id: string; userId: string; title: string; course: string; subject: string; due: string | null; instructions: string; targetWords: number; minWords: number; maxWords: number; sourceTarget: number; requirements: RequirementRecord[]; draft: string; updatedAt: string };
