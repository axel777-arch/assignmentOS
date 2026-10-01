"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { Assignment } from "@/types/assignment";

type Message = { role: "assistant" | "user"; text: string };

export function StudyAssistant({ assignment }: { assignment?: Assignment }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Ask about your brief, a requirement, or a next step. I’ll help you improve your own work." }]);
  const [value, setValue] = useState(""); const [loading, setLoading] = useState(false); const [mode, setMode] = useState("LOCAL COACH");
  async function send(event: FormEvent) {
    event.preventDefault(); const message = value.trim(); if (!message || loading) return;
    setMessages((current) => [...current, { role: "user", text: message }]); setValue(""); setLoading(true);
    try { const response = await api.assistant(assignment?.id, message); setMessages((current) => [...current, { role: "assistant", text: response.reply }]); setMode(response.provider === "ai" ? "AI CONNECTED" : "LOCAL COACH"); }
    catch { setMessages((current) => [...current, { role: "assistant", text: assignment ? `Start with one checklist item: ${assignment.requirements.find((item) => item.status !== "met")?.text || "review the brief and evidence"}. Make the change in your own words, then run the readiness check again.` : "Start by choosing an assignment brief. I can help you break it into steps, understand a concept, or check your evidence." }]); }
    finally { setLoading(false); }
  }
  return <section className="panel assistant-panel"><header className="panel-heading"><h2><Sparkles size={15} /> Study assistant</h2><span className="panel-kicker">{mode}</span></header><div className="assistant-content"><div className="assistant-messages" aria-live="polite">{messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${index}-${message.role}`}><span className="assistant-speaker">{message.role === "assistant" ? "OS" : "YOU"}</span><p>{message.text}</p></div>)}</div><div className="assistant-prompts"><button onClick={() => setValue("What should I work on next?")}>What next?</button><button onClick={() => setValue("How can I improve my evidence?")}>Improve evidence</button></div><form className="assistant-form" onSubmit={send}><input value={value} onChange={(event) => setValue(event.target.value)} maxLength={2000} placeholder="Ask about this assignment…" aria-label="Message study assistant" /><Button variant="primary" type="submit" aria-label="Send message" disabled={loading || !value.trim()}><ArrowUp size={15} /></Button></form><small className="assistant-note">Study support, not a finished submission.</small></div></section>;
}
