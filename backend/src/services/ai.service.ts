import { env } from "@/config/env";
import type { AssignmentRecord, RequirementRecord } from "@/types";
import { logger } from "@/utils/logger";

export async function aiRequest<T>(path: string, payload: unknown, timeoutMs = 8_000): Promise<T> {
  const response = await fetch(`${env.AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`AI service returned HTTP ${response.status}.`);
  return response.json() as Promise<T>;
}

export async function callLlm(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const timeoutMs = params.timeoutMs ?? 10_000;
  const temperature = params.temperature ?? 0.4;

  // 1. Try OpenAI if configured
  if (env.AI_PROVIDER === "openai" && env.AI_API_KEY) {
    try {
      const response = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AI_API_KEY}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model: env.AI_MODEL,
          temperature,
          max_tokens: params.maxTokens ?? 1000,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt }
          ]
        })
      });
      if (response.ok) {
        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (err) {
      logger.info("OpenAI request failed, falling back", { error: (err as Error).message });
    }
  }

  // 2. Try Ollama (Local LLM)
  try {
    const promptCombined = `${params.systemPrompt}\n\nTask:\n${params.userPrompt}`;
    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: promptCombined,
        stream: false,
        options: {
          temperature,
          num_predict: params.maxTokens ?? 600
        }
      })
    });
    if (response.ok) {
      const data = (await response.json()) as { response?: string };
      if (data.response && data.response.trim().length > 0) {
        return data.response.trim();
      }
    }
  } catch (err) {
    // Ollama not responding or timed out - this is handled gracefully by returning null
  }

  return null;
}

export async function extractRequirements(brief: string, targetWords = 0): Promise<RequirementRecord[]> {
  try {
    return (await aiRequest<{ requirements: RequirementRecord[] }>("/api/requirements/extract", { brief, targetWords }, 4_000)).requirements;
  } catch {
    const requirements: RequirementRecord[] = [];
    const range = brief.match(/\b([\d,]+)\s*(?:-|to|–)\s*([\d,]+)\s*words?\b/i);
    if (range) {
      requirements.push({
        id: crypto.randomUUID(),
        text: `Write between ${Number(range[1].replaceAll(",", ""))} and ${Number(range[2].replaceAll(",", ""))} words`,
        kind: "length",
        status: "not_checked"
      });
    } else if (targetWords) {
      requirements.push({
        id: crypto.randomUUID(),
        text: `Write approximately ${targetWords} words`,
        kind: "length",
        status: "not_checked"
      });
    }

    const source = brief.match(/\b(\d+)\s+(?:academic\s+)?sources?\b/i);
    if (source) {
      requirements.push({
        id: crypto.randomUUID(),
        text: `Use at least ${source[1]} identifiable sources`,
        kind: "sources",
        status: "not_checked"
      });
    }

    const actions = brief.matchAll(/\b(explain|discuss|describe|analyze|compare|evaluate)\s+([^.!?]+?)(?=\s+(?:and\s+)?(?:explain|discuss|describe|analyze|compare|evaluate)\b|[.!?]|$)/gi);
    for (const [, verb, detail] of actions) {
      requirements.push({
        id: crypto.randomUUID(),
        text: `${verb} ${detail.trim()}`,
        kind: "concept",
        status: "not_checked"
      });
    }

    return requirements.length
      ? requirements
      : [{ id: crypto.randomUUID(), text: brief.trim().slice(0, 180) || "Address the core question in the brief", kind: "concept", status: "not_checked" }];
  }
}

export type AnalysisItemOutput = {
  requirementId: string;
  status: "met" | "partial" | "missing";
  evidence: string;
  suggestion: string;
};

export type AnalysisOutput = {
  score: number;
  summary: string;
  items: AnalysisItemOutput[];
  disclaimer: string;
  missingRequirements: string[];
  weakSections: string[];
  missingTopics: string[];
  improvements: string[];
  checkedAt: string;
};

export function deterministicAnalyze(assignment: AssignmentRecord, draftHtml: string): AnalysisOutput {
  const plain = draftHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const lower = plain.toLowerCase();
  const words = plain.length ? plain.split(/\s+/).filter(Boolean).length : 0;

  // Extract headings
  const headings = Array.from(draftHtml.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)).map((m) =>
    m[1].replace(/<[^>]*>/g, "").trim().toLowerCase()
  );

  // Extract source entries / citations
  const citations = (plain.match(/\([^()\n]{2,80},?\s?(?:19|20)\d{2}[a-z]?\)|\[[0-9]{1,2}\]/gi) || []).length;
  const referencesSection = /references|works cited|bibliography/i.test(draftHtml);
  const detectedSources = Math.max(citations, referencesSection ? 3 : 0);

  const missingRequirements: string[] = [];
  const weakSections: string[] = [];
  const missingTopics: string[] = [];
  const improvements: string[] = [];

  const items: AnalysisItemOutput[] = (assignment.requirements || []).map((req) => {
    let status: "met" | "partial" | "missing" = "missing";
    let evidence = "No clear evidence was detected in the current draft.";
    let suggestion = `Address '${req.text}' clearly with supporting explanation.`;

    if (req.kind === "length") {
      const numbers = (req.text.match(/\d[\d,]*/g) || []).map((n) => Number(n.replace(/,/g, "")));
      const min = numbers[0] || assignment.minWords || assignment.targetWords || 500;
      const max = numbers[1] || assignment.maxWords || Math.round(min * 1.25);

      if (words >= min && (!max || words <= max)) {
        status = "met";
        evidence = `Draft has ${words} words, within required target (${min} - ${max}).`;
        suggestion = "Length target is met. Keep explanations concise and avoid unnecessary filler.";
      } else if (words > 0 && words < min) {
        status = "partial";
        evidence = `Draft has ${words} words, which is below the target minimum of ${min} words.`;
        suggestion = `Expand analysis and provide deeper explanations to reach ${min} words.`;
        weakSections.push("Overall length is below minimum target");
        improvements.push(`Expand draft by at least ${min - words} words with supporting analysis.`);
      } else if (max && words > max) {
        status = "partial";
        evidence = `Draft has ${words} words, which exceeds the target maximum of ${max} words.`;
        suggestion = `Trim redundant phrases and edit for conciseness to stay under ${max} words.`;
        improvements.push(`Edit draft to remove about ${words - max} excess words.`);
      } else {
        status = "missing";
        evidence = "No text written yet.";
        suggestion = `Write an initial draft targeting ${min} words.`;
        missingRequirements.push(req.text);
      }
    } else if (req.kind === "sources") {
      const targetMatch = req.text.match(/\d+/);
      const target = targetMatch ? Number(targetMatch[0]) : assignment.sourceTarget || 2;
      if (detectedSources >= target) {
        status = "met";
        evidence = `Found citations or reference markers indicating at least ${detectedSources} sources (target is ${target}).`;
        suggestion = "Ensure all in-text citations are accurately formatted and referenced.";
      } else if (detectedSources > 0) {
        status = "partial";
        evidence = `Found partial citation evidence (${detectedSources} source markers vs target ${target}).`;
        suggestion = `Incorporate evidence from ${target - detectedSources} additional scholarly sources.`;
        improvements.push(`Add ${target - detectedSources} more citations to satisfy '${req.text}'.`);
      } else {
        status = "missing";
        evidence = "No identifiable citations or bibliography section found.";
        suggestion = `Add in-text citations and a reference list to meet '${req.text}'.`;
        missingRequirements.push(req.text);
      }
    } else {
      // Concept or section requirement
      const reqKeywords = req.text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !["explain", "describe", "discuss", "analyze", "compare", "evaluate", "write", "about", "with", "that"].includes(w));

      const matchCount = reqKeywords.filter((k) => lower.includes(k)).length;
      const isHeading = headings.some((h) => reqKeywords.some((k) => h.includes(k)));

      if (matchCount >= Math.min(2, reqKeywords.length) || (reqKeywords.length === 1 && matchCount === 1)) {
        status = "met";
        evidence = `Keywords related to '${req.text}' appear with context in the draft.`;
        suggestion = "Ensure this concept is thoroughly explained with supporting examples.";
      } else if (matchCount > 0 || isHeading) {
        status = "partial";
        evidence = `Mentioned briefly, but may need deeper development to fully satisfy '${req.text}'.`;
        suggestion = `Dedicate a focused paragraph with evidence to '${req.text}'.`;
        weakSections.push(`Underdeveloped coverage of '${req.text}'`);
        improvements.push(`Flesh out the explanation of '${req.text}'.`);
      } else {
        status = "missing";
        evidence = `No direct discussion of '${req.text}' detected.`;
        suggestion = `Include a section or paragraph specifically addressing '${req.text}'.`;
        missingTopics.push(req.text);
        missingRequirements.push(req.text);
      }
    }

    return {
      requirementId: req.id,
      status,
      evidence,
      suggestion
    };
  });

  const total = items.length;
  const metCount = items.filter((i) => i.status === "met").length;
  const partialCount = items.filter((i) => i.status === "partial").length;
  const score = total > 0 ? Math.round(((metCount * 1.0 + partialCount * 0.5) / total) * 100) : (words > 100 ? 70 : 20);

  if (improvements.length === 0) {
    if (words === 0) improvements.push("Begin by drafting an introduction and outlining the main sections.");
    else improvements.push("Draft is progressing well; review transitions between sections and verify citations.");
  }

  return {
    score,
    summary: `${metCount} of ${total} requirements satisfied, with ${partialCount} partially addressed (${words} words).`,
    items,
    disclaimer: "This analysis is an academic readiness check against editable criteria, not an automated grade.",
    missingRequirements,
    weakSections,
    missingTopics,
    improvements,
    checkedAt: new Date().toISOString()
  };
}

export async function analyzeAssignment(assignment: AssignmentRecord, draft: string): Promise<AnalysisOutput> {
  // 1. Try external Python AI service if available
  try {
    const remote = await aiRequest<AnalysisOutput>("/api/analysis", { assignment, draft }, 3_500);
    if (remote && typeof remote.score === "number") {
      return {
        ...remote,
        missingRequirements: remote.missingRequirements || [],
        weakSections: remote.weakSections || [],
        missingTopics: remote.missingTopics || [],
        improvements: remote.improvements || [],
        checkedAt: new Date().toISOString()
      };
    }
  } catch {
    // Fall back to robust in-process analysis
  }

  // 2. Built-in deterministic analysis
  return deterministicAnalyze(assignment, draft);
}

export async function assistantReply(
  assignment: unknown,
  message: string,
  history: Array<{ role: string; message: string }> = [],
  documentExcerpts: Array<{ pageNumber: number; fileName: string; content: string }> = []
) {
  const systemPrompt = `You are an academic writing coach for AssignmentOS.
Help students understand assignment instructions, organize research, and revise their work.
Be concise, grounded in the assignment context, and academically constructive.`;

  const userPrompt = `Message: "${message}"\nContext: ${JSON.stringify(assignment)}\nHistory: ${JSON.stringify(history.slice(-3))}\nExcerpts: ${JSON.stringify(documentExcerpts)}`;

  const response = await callLlm({
    systemPrompt,
    userPrompt,
    temperature: 0.35,
    maxTokens: 500,
    timeoutMs: 8_000
  });

  if (response) {
    return { reply: response, provider: "ai" as const };
  }

  return {
    reply: "Review your draft against each requirement in the checklist to ensure all points are thoroughly developed with evidence.",
    provider: "local" as const
  };
}

