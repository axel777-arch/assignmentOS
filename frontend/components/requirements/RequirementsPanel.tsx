"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { RequirementItem } from "@/components/requirements/RequirementItem";
import type { Requirement } from "@/types/requirement";

export function RequirementsPanel({ requirements, onChange, onStatusChange, onAdd, onDelete }: { requirements: Requirement[]; onChange: (id: string, value: string) => void; onStatusChange: (id: string, status: Requirement["status"]) => void; onAdd: (text: string) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  function submit(event: React.FormEvent) { event.preventDefault(); if (!text.trim()) return; onAdd(text.trim()); setText(""); setAdding(false); }
  return <section className="panel requirements-panel"><header className="panel-heading"><div><h2>Assignment requirements</h2><span className="panel-kicker">EDITABLE CHECKLIST</span></div><Button variant="quiet" className="button-small" onClick={() => setAdding((value) => !value)}><Plus size={14} /> Add</Button></header>
    <div className="requirements-list">{requirements.map((item) => <RequirementItem key={item.id} item={item} onChange={(value) => onChange(item.id, value)} onStatusChange={(status) => onStatusChange(item.id, status)} onDelete={() => onDelete(item.id)} />)}{!requirements.length && <p className="empty-state">Paste the brief to start a checklist.</p>}
      {adding && <form className="inline-add" onSubmit={submit}><input autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a requirement" aria-label="New requirement" /><Button variant="primary" type="submit">Add</Button></form>}
    </div>
  </section>;
}
