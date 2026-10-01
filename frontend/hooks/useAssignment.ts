"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { makeSampleAssignment } from "@/lib/utils";
import type { Assignment, AssignmentInput } from "@/types/assignment";

export function useAssignment(id?: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.assignments.list();
      const available = list.length ? list : [makeSampleAssignment()];
      setAssignments(available);
      setAssignment(id ? await api.assignments.get(id) : available[0]);
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load assignment."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (input: AssignmentInput) => {
    const created = await api.assignments.create(input);
    setAssignments((current) => [created, ...current]); setAssignment(created); return created;
  }, []);
  const activeId = assignment?.id;
  const update = useCallback(async (updates: Partial<Assignment>) => {
    if (!activeId) return null;
    const saved = await api.assignments.update(activeId, updates);
    setAssignment(saved); setAssignments((current) => current.map((item) => item.id === saved.id ? saved : item)); return saved;
  }, [activeId]);

  return { assignment, assignments, loading, error, refresh, create, update };
}
