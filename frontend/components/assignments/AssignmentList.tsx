import type { Assignment } from "@/types/assignment";
import { AssignmentCard } from "@/components/assignments/AssignmentCard";

export function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  if (!assignments.length) return <div className="empty-state">Your next assignment starts with the brief.</div>;
  return <div className="assignment-grid">{assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} />)}</div>;
}
