import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";

export default async function AssignmentAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DashboardWorkspace assignmentId={id} current="Analysis" />;
}
