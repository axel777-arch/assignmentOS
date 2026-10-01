import { CheckCircle2, Clock3, FileText } from "lucide-react";
import type { Assignment } from "@/types/assignment";

export function ProgressCard({ assignments }: { assignments: Assignment[] }) {
  const requirements = assignments.flatMap((item) => item.requirements);
  const complete = requirements.filter((item) => item.status === "met").length;
  return <section className="progress-strip"><div><span className="progress-icon"><FileText size={17} /></span><span><strong>{assignments.length}</strong><small>Active assignments</small></span></div><div><span className="progress-icon"><CheckCircle2 size={17} /></span><span><strong>{complete}/{requirements.length}</strong><small>Requirements checked</small></span></div><div><span className="progress-icon"><Clock3 size={17} /></span><span><strong>{assignments.filter((item) => item.due).length}</strong><small>Upcoming deadlines</small></span></div></section>;
}
