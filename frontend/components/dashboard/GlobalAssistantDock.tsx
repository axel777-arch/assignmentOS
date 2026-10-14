"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AssistantDock } from "@/components/dashboard/AssistantDock";
import { api } from "@/lib/api";
import type { Assignment } from "@/types/assignment";

export function GlobalAssistantDock() {
  const pathname = usePathname();
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    const match = pathname?.match(/\/assignments\/([a-zA-Z0-9-]+)/);
    const assignmentId = match && match[1] !== "new" ? match[1] : null;

    if (!assignmentId) {
      setActiveAssignment(null);
      return;
    }

    let isMounted = true;
    api.assignments.get(assignmentId)
      .then((data) => {
        if (isMounted) setActiveAssignment(data);
      })
      .catch(() => undefined);

    return () => { isMounted = false; };
  }, [pathname]);

  if (pathname === "/login") return null;
  return <AssistantDock assignment={activeAssignment} />;
}
