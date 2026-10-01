import type { Assignment } from "@/types/assignment";
import { AssignmentList } from "@/components/assignments/AssignmentList";

export function RecentAssignments({ assignments }: { assignments: Assignment[] }) {
  return <section className="dashboard-section"><div className="section-heading"><div><span className="eyebrow">IN PROGRESS</span><h2>Recent assignments</h2></div></div><AssignmentList assignments={assignments.slice(0, 4)} /></section>;
}
