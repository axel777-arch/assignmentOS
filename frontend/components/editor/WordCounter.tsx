import { countWords } from "@/lib/utils";

export function WordCounter({ content, target }: { content: string; target?: number }) {
  const words = countWords(content);
  return <span className="word-counter">{words.toLocaleString()} words{target ? ` · ${Math.max(1, Math.ceil(words / target * 100))}% of target` : ""}</span>;
}
