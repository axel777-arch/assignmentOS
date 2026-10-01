import type { Requirement } from "@/types/requirement";

export function countWords(value: string) {
  return value.replace(/<[^>]*>/g, " ").trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export function makeId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export function extractRequirements(brief: string, targetWords = 0): Requirement[] {
  const items: Requirement[] = [];
  const add = (text: string, kind: Requirement["kind"]) => {
    if (!items.some((item) => item.text.toLowerCase() === text.toLowerCase())) {
      items.push({ id: makeId("req"), text, kind, status: "not_checked" });
    }
  };
  const range = brief.match(/\b([\d,]+)\s*(?:-|to|–)\s*([\d,]+)\s*(words?|pages?)\b/i);
  if (range) add(`Write between ${Number(range[1].replaceAll(",", "")).toLocaleString()} and ${Number(range[2].replaceAll(",", "")).toLocaleString()} ${range[3].toLowerCase()}`, "length");
  else if (targetWords) add(`Write approximately ${targetWords.toLocaleString()} words`, "length");
  const sourceMatch = brief.match(/\b(?:at least|minimum of|min\.?\s*)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:academic\s+|credible\s+|scholarly\s+)?sources?\b/i);
  const quantities: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  if (sourceMatch) add(`Use at least ${Number(sourceMatch[1]) || quantities[sourceMatch[1].toLowerCase()]} identifiable sources`, "sources");
  const actions = brief.matchAll(/\b(explain|discuss|describe|analyze|analyse|compare|evaluate|cover|address)\s+([^.!?]+?)(?=\s+(?:and\s+)?(?:explain|discuss|describe|analyze|analyse|compare|evaluate|cover|address)\b|[.!?]|$)/gi);
  for (const [, verb, detail] of actions) if (detail.trim().length > 3) add(`${verb} ${detail.trim()}`, "concept");
  if (!items.length && brief.trim()) add(brief.trim().split(/[.!?]+/)[0], "concept");
  return items;
}

export function makeSampleAssignment() {
  return {
    id: "sample-electrolysis",
    title: "Electrolysis and its applications",
    course: "Chemistry 201",
    subject: "CHEMISTRY · LAB REPORT",
    due: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    instructions: "Write a 1,200 to 1,500 word chemistry report on electrolysis. Explain the process, discuss Faraday's laws, describe two applications, and use at least four sources.",
    targetWords: 1350,
    minWords: 1200,
    maxWords: 1500,
    sourceTarget: 4,
    requirements: [
      { id: "r-topic", text: "Explain the electrolysis process", kind: "concept" as const, status: "not_checked" as const },
      { id: "r-laws", text: "Discuss Faraday's laws", kind: "concept" as const, status: "not_checked" as const },
      { id: "r-apps", text: "Describe two applications", kind: "concept" as const, status: "not_checked" as const },
      { id: "r-sources", text: "Use at least 4 identifiable sources", kind: "sources" as const, status: "not_checked" as const },
      { id: "r-length", text: "Write between 1,200 and 1,500 words", kind: "length" as const, status: "not_checked" as const }
    ],
    draft: "<h2>Electrolysis: an introduction</h2><p>Electrolysis uses an external electrical current to drive a chemical reaction that would not occur spontaneously. In an electrolytic cell, a power supply moves electrons through the circuit while ions carry charge through the electrolyte. Reduction takes place at the cathode and oxidation at the anode.</p><h3>Faraday's laws</h3><p>The amount of substance produced at an electrode is proportional to the total electric charge passed through the cell.</p><h3>Applications</h3><p>Electroplating deposits a thin metal coating on an object. Electrolysis is also used to extract and refine metals.</p><h3>References</h3><p>Brown, T. et al. Chemistry: The Central Science.<br>Faraday, M. Experimental Researches in Electricity.</p>"
  };
}
