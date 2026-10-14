"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  FileEdit,
  FilePlus2,
  FileText,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
  PenTool,
  RotateCw,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export type DraftWriterAction =
  | "generate_initial_draft"
  | "generate_outline"
  | "expand_section"
  | "rewrite_clarity"
  | "improve_grammar"
  | "simplify"
  | "develop_paragraph"
  | "shorten"
  | "elaborate"
  | "improve_transitions"
  | "suggest_examples";

interface DraftWriterProps {
  assignmentId: string;
  assignmentTitle: string;
  subject?: string;
  selectedText?: string;
  currentDraft?: string;
  isOpen: boolean;
  onClose: () => void;
  onInsertContent: (content: string, replaceSelected: boolean) => void;
}

const ACTION_GROUPS = [
  {
    label: "Drafting & Structure",
    items: [
      { id: "generate_initial_draft", title: "Initial Draft from Requirements", icon: FilePlus2, desc: "Draft full content addressing all criteria" },
      { id: "generate_outline", title: "Comprehensive Outline", icon: FileText, desc: "Structured thesis & section breakdown" },
      { id: "develop_paragraph", title: "Develop Paragraph", icon: PenTool, desc: "Add analytical depth to the current idea" }
    ]
  },
  {
    label: "Refinement & Clarity",
    items: [
      { id: "rewrite_clarity", title: "Rewrite for Clarity", icon: Wand2, desc: "Polish phrasing without changing arguments" },
      { id: "improve_grammar", title: "Improve Grammar & Flow", icon: FileEdit, desc: "Fix sentence flow & academic syntax" },
      { id: "simplify", title: "Simplify Difficult Explanations", icon: HelpCircle, desc: "Make complex jargon clear and readable" }
    ]
  },
  {
    label: "Expansion & Evidence",
    items: [
      { id: "expand_section", title: "Expand Selected Section", icon: Maximize2, desc: "Deepen explanation with supporting details" },
      { id: "suggest_examples", title: "Suggest Relevant Examples", icon: Lightbulb, desc: "Grounded real-world / scholarly examples" },
      { id: "improve_transitions", title: "Bridge Section Transitions", icon: RotateCw, desc: "Create smooth logical links between ideas" },
      { id: "shorten", title: "Shorten & Condense", icon: Minimize2, desc: "Make sentences tight and punchy" },
      { id: "elaborate", title: "Elaborate with Nuance", icon: BookOpen, desc: "Unpack theoretical depth" }
    ]
  }
];

export function DraftWriterModal({
  assignmentId,
  assignmentTitle,
  subject,
  selectedText = "",
  currentDraft = "",
  isOpen,
  onClose,
  onInsertContent
}: DraftWriterProps) {
  const [selectedAction, setSelectedAction] = useState<DraftWriterAction>(
    selectedText ? "expand_section" : "generate_initial_draft"
  );
  const [customInstruction, setCustomInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    content: string;
    wordCount: number;
    notes?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await api.writing.draft({
        assignmentId,
        action: selectedAction,
        selectedText: selectedText || undefined,
        currentDraft: currentDraft || undefined,
        customInstruction: customInstruction.trim() || undefined
      });
      setGeneratedResult({
        content: res.generatedContent,
        wordCount: res.wordCount,
        notes: res.notes
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function handleInsert(replace: boolean) {
    if (!generatedResult?.content) return;
    onInsertContent(generatedResult.content, replace);
    onClose();
  }

  function handleCopy() {
    if (!generatedResult?.content) return;
    const plain = generatedResult.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="draft-writer-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="draft-writer-panel" role="dialog" aria-modal="true" aria-labelledby="draft-writer-title">
        <header className="draft-writer-header">
          <div className="header-meta">
            <span className="badge badge-good"><Sparkles size={12} /> Draft Writer</span>
            <h2 id="draft-writer-title">{assignmentTitle}</h2>
            {subject && <small className="subject-tag">{subject}</small>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close Draft Writer">
            <X size={18} />
          </button>
        </header>

        <div className="draft-writer-body">
          {/* Left Column: Actions & Context */}
          <div className="draft-writer-controls">
            {selectedText && (
              <div className="selected-text-callout">
                <span className="label">Working with selected text ({selectedText.split(/\s+/).filter(Boolean).length} words):</span>
                <p>"{selectedText.slice(0, 180)}{selectedText.length > 180 ? "…" : ""}"</p>
              </div>
            )}

            <div className="actions-section">
              <label className="section-label">Choose Writing Action:</label>
              <div className="actions-accordion">
                {ACTION_GROUPS.map((group) => (
                  <div key={group.label} className="action-group">
                    <span className="group-title">{group.label}</span>
                    <div className="action-buttons-list">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isSelected = selectedAction === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`action-btn ${isSelected ? "active" : ""}`}
                            onClick={() => setSelectedAction(item.id as DraftWriterAction)}
                          >
                            <Icon size={14} className="action-icon" />
                            <div className="action-text">
                              <strong>{item.title}</strong>
                              <small>{item.desc}</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="field custom-instruction-field">
              <label className="field-label">Specific Guidance or Focus (optional):</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Focus on Faraday's first law with industrial examples…"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
              />
            </div>

            {error && <p className="field-error">{error}</p>}

            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ width: "100%", justifyContent: "center", minHeight: "40px" }}
            >
              {generating ? <Spinner label="Drafting with assignment context…" /> : <><Sparkles size={15} /> Generate Draft Content</>}
            </Button>
          </div>

          {/* Right Column: Editorial Preview & Safety Confirmation */}
          <div className="draft-writer-preview-pane">
            <div className="preview-pane-header">
              <h3>Editorial Preview</h3>
              {generatedResult && (
                <div className="preview-meta-badges">
                  <span className="badge">{generatedResult.wordCount} words</span>
                  <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              )}
            </div>

            <div className="preview-scroll-area">
              {generatedResult ? (
                <div
                  className="generated-prose-content"
                  dangerouslySetInnerHTML={{ __html: generatedResult.content }}
                />
              ) : (
                <div className="preview-empty-state">
                  <PenTool size={36} />
                  <p>Select a writing action and click <strong>"Generate Draft Content"</strong>.</p>
                  <small>
                    The Draft Writer uses your assignment's title, subject, and requirements to generate academically sound content.
                    You will always be able to review the text before inserting it into your assignment.
                  </small>
                </div>
              )}
            </div>

            {generatedResult && (
              <footer className="preview-action-footer">
                <small className="academic-notice">
                  Review carefully before insertion. Never replaces entire draft silently.
                </small>
                <div className="footer-buttons">
                  {selectedText && (
                    <Button variant="quiet" onClick={() => handleInsert(true)}>
                      Replace Selected ({selectedText.split(/\s+/).filter(Boolean).length}w)
                    </Button>
                  )}
                  <Button variant="primary" onClick={() => handleInsert(false)}>
                    Insert at Cursor
                  </Button>
                </div>
              </footer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
