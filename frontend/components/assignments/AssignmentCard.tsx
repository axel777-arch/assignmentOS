import Link from "next/link";
import { ArrowUpRight, CalendarDays, FileText } from "lucide-react";
import type { Assignment } from "@/types/assignment";

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return <Link className="assignment-card" href={`/assignments/${assignment.id}`}><div className="assignment-card-top"><span className="subject-mark"><FileText size={17} /></span><span className="course-label">{assignment.course || "Independent study"}</span><ArrowUpRight size={15} /></div><h3>{assignment.title}</h3><p>{assignment.instructions || "Add the assignment brief and start a draft."}</p><div className="assignment-card-footer"><span><CalendarDays size={13} />{assignment.due || "No deadline"}</span><span>{assignment.requirements.length} requirements</span></div></Link>;
}
