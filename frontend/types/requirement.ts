export type RequirementStatus = "not_checked" | "met" | "partial" | "missing";
export type RequirementKind = "concept" | "section" | "length" | "sources" | "deadline";

export type Requirement = {
  id: string;
  text: string;
  kind: RequirementKind;
  status: RequirementStatus;
  evidence?: string;
};
