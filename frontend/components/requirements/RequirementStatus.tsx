import { Badge } from "@/components/ui/Badge";
import type { RequirementStatus } from "@/types/requirement";

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  const tone = status === "met" ? "good" : status === "partial" ? "warning" : status === "missing" ? "danger" : "neutral";
  const label = status === "not_checked" ? "To review" : status === "met" ? "Met" : status === "partial" ? "Partial" : "Missing";
  return <Badge tone={tone}>{label}</Badge>;
}
