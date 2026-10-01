import type { Metadata } from "next";
import { GlobalAssistantDock } from "@/components/dashboard/GlobalAssistantDock";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssignmentOS · Your work, in focus",
  description: "A student-centered academic workspace for assignment planning, writing, and course-material research."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<GlobalAssistantDock /></body></html>;
}
