"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { Requirement } from "@/types/requirement";

export function useRequirements(initial: Requirement[] = []) {
  const [requirements, setRequirements] = useState(initial);
  const extract = useCallback(async (brief: string, targetWords = 0) => {
    const result = await api.requirements.extract(brief, targetWords);
    setRequirements(result); return result;
  }, []);
  const update = useCallback((id: string, text: string) => setRequirements((items) => items.map((item) => item.id === id ? { ...item, text } : item)), []);
  const remove = useCallback((id: string) => setRequirements((items) => items.filter((item) => item.id !== id)), []);
  const add = useCallback((text: string) => setRequirements((items) => [...items, { id: `req-${crypto.randomUUID()}`, text, kind: "concept", status: "not_checked" }]), []);
  return { requirements, setRequirements, extract, update, remove, add };
}
