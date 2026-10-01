import Link from "next/link";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";

export default async function AssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><DashboardWorkspace assignmentId={id} current="My assignments" /><nav className="route-shortcuts"><Link href={`/assignments/${id}/editor`}><FileText size={15} /> Editor <ArrowRight size={14} /></Link><Link href={`/assignments/${id}/research`}><BookOpen size={15} /> Research <ArrowRight size={14} /></Link><Link href={`/assignments/${id}/analysis`}>Analysis <ArrowRight size={14} /></Link></nav></>;
}
