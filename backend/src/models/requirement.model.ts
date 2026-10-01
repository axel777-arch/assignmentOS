import type { RequirementRecord } from "@/types";
export type RequirementRow = RequirementRecord & { assignment_id: string; created_at: Date };
