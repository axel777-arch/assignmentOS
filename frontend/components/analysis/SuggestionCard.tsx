import { Lightbulb } from "lucide-react";

export function SuggestionCard({ children }: { children: string }) {
  return <div className="suggestion-card"><Lightbulb size={15} aria-hidden="true" /><p>{children}</p></div>;
}
