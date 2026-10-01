"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AssignmentInput } from "@/types/assignment";

export function CreateAssignment({ onCreate, busy = false }: { onCreate: (input: AssignmentInput) => Promise<unknown>; busy?: boolean }) {
  const [title, setTitle] = useState(""); const [course, setCourse] = useState(""); const [due, setDue] = useState(""); const [instructions, setInstructions] = useState(""); const [target, setTarget] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const range = instructions.match(/\b([\d,]+)\s*(?:-|to|–)\s*([\d,]+)\s*words?\b/i);
    const source = instructions.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:academic\s+)?sources?\b/i);
    const sourceCount = source ? Number(source[1]) || ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }[source[1].toLowerCase()] || 0) : 0;
    try { await onCreate({ title: title.trim(), course: course.trim(), subject: course.trim().toUpperCase(), due: due || null, instructions: instructions.trim(), targetWords: Number(target) || 0, minWords: range ? Number(range[1].replaceAll(",", "")) : 0, maxWords: range ? Number(range[2].replaceAll(",", "")) : 0, sourceTarget: sourceCount }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create assignment."); }
  }
  return <form className="create-form" onSubmit={submit}><Input id="assignment-title" label="Assignment title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. Electrolysis and its applications" /><Input id="assignment-course" label="Course or subject" value={course} onChange={(event) => setCourse(event.target.value)} placeholder="e.g. Chemistry 201" /><Input id="assignment-due" label="Deadline" type="date" value={due} onChange={(event) => setDue(event.target.value)} /><Input id="assignment-target" label="Target words (optional)" type="number" min="1" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="1,200" /><label className="field" htmlFor="assignment-instructions"><span className="field-label">Teacher's instructions</span><textarea id="assignment-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Paste the brief. Concrete requirements become an editable checklist." rows={6} /></label>{error && <p className="field-error">{error}</p>}<Button variant="primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create workspace"}</Button></form>;
}
