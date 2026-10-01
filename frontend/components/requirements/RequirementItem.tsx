"use client";

import { Trash2 } from "lucide-react";
import { RequirementStatusBadge } from "@/components/requirements/RequirementStatus";
import type { Requirement } from "@/types/requirement";

export function RequirementItem({ item, onChange, onStatusChange, onDelete }: { item: Requirement; onChange: (value: string) => void; onStatusChange: (status: Requirement["status"]) => void; onDelete: () => void }) {
  return <div className="requirement-row"><input className="requirement-check" type="checkbox" checked={item.status === "met"} aria-label={`Mark ${item.text} as met`} onChange={(event) => onStatusChange(event.target.checked ? "met" : "not_checked")} /><span className={`status-dot ${item.status}`} /><input className="requirement-edit" aria-label="Edit requirement" value={item.text} onChange={(event) => onChange(event.target.value)} /><RequirementStatusBadge status={item.status} /><button className="icon-button mini" onClick={onDelete} aria-label="Remove requirement"><Trash2 size={14} /></button></div>;
}
