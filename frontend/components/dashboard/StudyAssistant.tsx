"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUp, BookOpen, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { Assignment } from "@/types/assignment";

type Message = { role: "assistant" | "user"; text: string };

export function StudyAssistant({ assignment }: { assignment?: Assignment }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: assignment ? `Bound to active assignment "${assignment.title}". Ask about your brief, requirements, or next steps.` : "Ask about your brief, a requirement, or a next step. I’ll help you improve your own work." }
  ]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("LOCAL COACH");

  useEffect(() => {
    if (!assignment?.id) return;
    let isMounted = true;
    api.assistantHistory(assignment.id)
      .then((records) => {
        if (!isMounted) return;
        if (records.length > 0) {
          setMessages(records.map((r) => ({ role: r.role, text: r.message })));
        } else {
          setMessages([
            { role: "assistant", text: `Bound to active assignment "${assignment.title}". Ask about your brief, requirements, draft, or next steps.` }
          ]);
        }
      })
      .catch(() => undefined);
    return () => { isMounted = false; };
  }, [assignment?.id, assignment?.title]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = value.trim();
    if (!message || loading) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setValue("");
    setLoading(true);
    try {
      const response = await api.assistant(assignment?.id, message);
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
      setMode(response.provider === "ai" ? "AI CONNECTED" : "LOCAL COACH");
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: assignment
            ? `Start with one checklist item: ${assignment.requirements.find((item) => item.status !== "met")?.text || "review the brief and evidence"}. Make the change in your own words, then run the readiness check again.`
            : "Start by choosing an assignment brief. I can help you break it into steps, understand a concept, or check your evidence."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel assistant-panel">
      <header className="panel-heading">
        <h2><Sparkles size={15} /> Study assistant</h2>
        <span className="panel-kicker">{mode}</span>
      </header>
      {assignment && (
        <div className="active-context-badge">
          <BookOpen size={12} />
          <span>Active Assignment: <strong>{assignment.title}</strong></span>
        </div>
      )}
      <div className="assistant-content">
        <div className="assistant-messages" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`assistant-message ${message.role}`} key={`${index}-${message.role}`}>
              <span className="assistant-speaker">{message.role === "assistant" ? "OS" : "YOU"}</span>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="assistant-prompts">
          <button type="button" onClick={() => setValue("What should I work on next?")}>What next?</button>
          <button type="button" onClick={() => setValue("How can I improve my evidence?")}>Improve evidence</button>
          <button type="button" onClick={() => setValue("Check my draft against requirements")}>Check draft</button>
        </div>
        <form className="assistant-form" onSubmit={send}>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={2000}
            placeholder={assignment ? `Ask about "${assignment.title}"…` : "Ask about this assignment…"}
            aria-label="Message study assistant"
          />
          <Button variant="primary" type="submit" aria-label="Send message" disabled={loading || !value.trim()}>
            <ArrowUp size={15} />
          </Button>
        </form>
        <small className="assistant-note">Study support grounded in your assignment context.</small>
      </div>
    </section>
  );
}
