import type { Requirement } from "@/types/requirement";

export type Assignment = {
  id: string;
  title: string;
  course: string;
  subject: string;
  due: string | null;
  instructions: string;
  targetWords: number;
  minWords: number;
  maxWords: number;
  sourceTarget: number;
  requirements: Requirement[];
  draft: string;
  updatedAt?: string;
};

export type AssignmentInput = Pick<Assignment, "title" | "course" | "subject" | "due" | "instructions" | "targetWords" | "minWords" | "maxWords" | "sourceTarget">;
