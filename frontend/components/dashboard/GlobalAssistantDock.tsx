"use client";

import { usePathname } from "next/navigation";
import { AssistantDock } from "@/components/dashboard/AssistantDock";

export function GlobalAssistantDock() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <AssistantDock />;
}
