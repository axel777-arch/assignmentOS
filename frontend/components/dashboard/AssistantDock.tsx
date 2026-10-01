"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { StudyAssistant } from "@/components/dashboard/StudyAssistant";
import type { Assignment } from "@/types/assignment";

export function AssistantDock({ assignment }: { assignment?: Assignment | null }) {
  const [open, setOpen] = useState(false);
  return <div className="assistant-dock"><button className="assistant-launcher" type="button" aria-label={open ? "Close study assistant" : "Open study assistant"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={19} /> : <MessageCircle size={19} />}</button>{open && <section className="assistant-flyout" aria-label="Study assistant"><header><div><span className="eyebrow">ASSIGNMENTOS</span><h2>Study assistant</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close study assistant"><X size={16} /></button></header><StudyAssistant assignment={assignment || undefined} /></section>}</div>;
}
