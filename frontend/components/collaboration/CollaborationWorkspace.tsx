"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileCheck,
  GitCompare,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { api, type CollaborationChatMessage, type CollaborationDetails, type CollaborationDraftItem, type CollaborationItem } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function CollaborationWorkspace({ assignmentId, onClose }: { assignmentId?: string; onClose?: () => void }) {
  const [collabList, setCollabList] = useState<CollaborationItem[]>([]);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [details, setDetails] = useState<CollaborationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Share Form state
  const [shareRecipient, setShareRecipient] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");

  // Chat input state
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // AI Workflow Action states
  const [comparing, setComparing] = useState(false);
  const [differentiating, setDifferentiating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");

  // Active Draft View Tab state
  const [activeTab, setActiveTab] = useState<"compare" | "shared" | "differentiated" | "chat">("compare");

  // Load user collaborations list
  useEffect(() => {
    let isMounted = true;
    api.collaborations.list()
      .then((items) => {
        if (!isMounted) return;
        setCollabList(items);
        if (assignmentId) {
          const match = items.find((c) => c.assignmentId === assignmentId);
          if (match) setSelectedCollabId(match.id);
          else if (items.length > 0) setSelectedCollabId(items[0].id);
        } else if (items.length > 0) {
          setSelectedCollabId(items[0].id);
        }
      })
      .catch((err) => setError(err.message || "Failed to load collaborations."))
      .finally(() => setLoading(false));

    return () => { isMounted = false; };
  }, [assignmentId]);

  // Load details when selected collaboration changes
  useEffect(() => {
    if (!selectedCollabId) return;
    let isMounted = true;
    setLoading(true);
    api.collaborations.get(selectedCollabId)
      .then((data) => {
        if (!isMounted) return;
        setDetails(data);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load collaboration details."))
      .finally(() => setLoading(false));

    return () => { isMounted = false; };
  }, [selectedCollabId]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!assignmentId || !shareRecipient.trim()) return;
    setSharing(true);
    setError("");
    setShareSuccess("");
    try {
      const created = await api.collaborations.share(assignmentId, shareRecipient.trim());
      setShareSuccess(`Shared with ${created.collaboratorName || shareRecipient}!`);
      setShareRecipient("");
      const updatedList = await api.collaborations.list();
      setCollabList(updatedList);
      setSelectedCollabId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sharing failed.");
    } finally {
      setSharing(false);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCollabId || !chatMessage.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      const chat = await api.collaborations.chat(selectedCollabId, chatMessage.trim());
      setDetails((prev) => prev ? { ...prev, chats: [...prev.chats, chat] } : null);
      setChatMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSendingChat(false);
    }
  }

  async function handleRunAIComparison() {
    if (!selectedCollabId || comparing) return;
    setComparing(true);
    setError("");
    try {
      await api.collaborations.compare(selectedCollabId);
      const updatedDetails = await api.collaborations.get(selectedCollabId);
      setDetails(updatedDetails);
      setActiveTab("shared");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Comparison failed.");
    } finally {
      setComparing(false);
    }
  }

  async function handleRunDifferentiate() {
    if (!selectedCollabId || differentiating) return;
    setDifferentiating(true);
    setError("");
    try {
      await api.collaborations.differentiate(selectedCollabId);
      const updatedDetails = await api.collaborations.get(selectedCollabId);
      setDetails(updatedDetails);
      setActiveTab("differentiated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft differentiation failed.");
    } finally {
      setDifferentiating(false);
    }
  }

  async function handleApplyDraft(draftId: string) {
    if (!selectedCollabId || applying) return;
    setApplying(true);
    setError("");
    setApplySuccess("");
    try {
      await api.collaborations.applyDraft(selectedCollabId, draftId);
      setApplySuccess("Draft successfully updated in your assignment workspace!");
      setTimeout(() => setApplySuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply draft.");
    } finally {
      setApplying(false);
    }
  }

  const latestSharedDraft = details?.drafts.find((d) => d.draftType === "shared_improved");
  const latestDifferentiatedDraft = details?.drafts.find((d) => d.draftType === "differentiated");
  const meta = latestSharedDraft?.comparisonMetadata as Record<string, string[]> | null;

  return (
    <div className="collab-modal-backdrop">
      <div className="collab-modal-container">
        <header className="collab-header">
          <div className="collab-title-group">
            <h2><Users size={18} /> Student-to-Student Collaboration</h2>
            <p className="subtitle">Collaborate on drafts, discuss ideas, and refine work with AI comparison.</p>
          </div>
          {onClose && (
            <button className="icon-button" onClick={onClose} aria-label="Close collaboration window">
              <X size={18} />
            </button>
          )}
        </header>

        {/* Top Control Bar */}
        <div className="collab-control-bar">
          {collabList.length > 0 && (
            <div className="collab-select-group">
              <label htmlFor="collab-select">Session:</label>
              <select
                id="collab-select"
                value={selectedCollabId || ""}
                onChange={(e) => setSelectedCollabId(e.target.value)}
              >
                {collabList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.assignmentTitle} ({c.ownerName} & {c.collaboratorName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignmentId && (
            <form className="collab-share-form" onSubmit={handleShare}>
              <input
                type="text"
                value={shareRecipient}
                onChange={(e) => setShareRecipient(e.target.value)}
                placeholder="Student username or email…"
                required
              />
              <Button type="submit" variant="primary" disabled={sharing || !shareRecipient.trim()}>
                <Share2 size={14} /> {sharing ? "Sharing…" : "Share Assignment"}
              </Button>
            </form>
          )}
        </div>

        {shareSuccess && <p className="collab-alert success"><CheckCircle2 size={14} /> {shareSuccess}</p>}
        {applySuccess && <p className="collab-alert success"><CheckCircle2 size={14} /> {applySuccess}</p>}
        {error && <p className="collab-alert error"><AlertCircle size={14} /> {error}</p>}

        {!selectedCollabId && !loading && (
          <div className="collab-empty">
            <Users size={36} />
            <h3>No active collaboration selected</h3>
            <p>Share this assignment with a study partner by entering their username or email above.</p>
          </div>
        )}

        {loading && <div className="collab-loading"><Spinner label="Loading collaboration workspace…" /></div>}

        {details && !loading && (
          <div className="collab-grid">
            {/* Left Sidebar: AI Actions & Integrated Chat */}
            <aside className="collab-sidebar">
              <div className="collab-ai-actions">
                <h3><Sparkles size={14} /> AI Collaboration Actions</h3>
                <div className="collab-action-buttons">
                  <Button variant="primary" onClick={handleRunAIComparison} disabled={comparing}>
                    <GitCompare size={14} /> {comparing ? "Comparing Drafts…" : "Compare Our Drafts"}
                  </Button>
                  <Button variant="quiet" onClick={() => setActiveTab("compare")}>
                    <FileCheck size={14} /> Show Comparison Analysis
                  </Button>
                  <Button variant="quiet" onClick={handleRunDifferentiate} disabled={differentiating || !latestSharedDraft}>
                    <Copy size={14} /> {differentiating ? "Creating Version…" : "Create My Own Version"}
                  </Button>
                </div>
                <small className="ai-disclaimer-note">
                  AI comparison identifies strengths & gaps. Differentiation allows independent phrasing while respecting academic integrity.
                </small>
              </div>

              {/* Integrated Chat Box */}
              <div className="collab-chat-box">
                <header className="chat-box-header">
                  <h4><MessageSquare size={14} /> Collaboration Chat</h4>
                  <span>{details.chats.length} messages</span>
                </header>

                <div className="chat-messages-scroll">
                  {details.chats.length === 0 ? (
                    <p className="empty-chat-note">Discuss assignment ideas and revisions with your study partner here.</p>
                  ) : (
                    details.chats.map((c) => (
                      <div key={c.id} className="chat-bubble">
                        <div className="chat-bubble-meta">
                          <strong>{c.senderName}</strong>
                          <small>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                        </div>
                        <p>{c.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form className="chat-input-form" onSubmit={handleSendChat}>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Message study partner…"
                    maxLength={1000}
                  />
                  <button type="submit" disabled={sendingChat || !chatMessage.trim()} aria-label="Send message">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </aside>

            {/* Right Main Area: Draft Viewer & Comparisons */}
            <main className="collab-main-view">
              <nav className="collab-tabs">
                <button className={activeTab === "compare" ? "active" : ""} onClick={() => setActiveTab("compare")}>
                  Comparison Analysis
                </button>
                <button className={activeTab === "shared" ? "active" : ""} onClick={() => setActiveTab("shared")}>
                  Shared Improved Draft {latestSharedDraft && `(v${latestSharedDraft.version})`}
                </button>
                <button className={activeTab === "differentiated" ? "active" : ""} onClick={() => setActiveTab("differentiated")}>
                  My Differentiated Version {latestDifferentiatedDraft && `(v${latestDifferentiatedDraft.version})`}
                </button>
              </nav>

              <div className="collab-tab-content">
                {activeTab === "compare" && (
                  <div className="collab-analysis-card">
                    <h3>Draft Comparison Findings</h3>
                    {!meta ? (
                      <div className="prompt-callout">
                        <Sparkles size={20} />
                        <p>Click <strong>"Compare Our Drafts"</strong> to let AI compare both students' drafts, identify missing requirements, and generate an improved combined draft.</p>
                      </div>
                    ) : (
                      <div className="findings-grid">
                        <div className="finding-box positive">
                          <h4>Strengths from Student A</h4>
                          <ul>{(meta.strengthsA || ["Strong thesis"]).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="finding-box positive">
                          <h4>Strengths from Student B</h4>
                          <ul>{(meta.strengthsB || ["Good supporting evidence"]).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="finding-box warning">
                          <h4>Missing Requirements</h4>
                          <ul>{(meta.missingRequirements || ["None detected"]).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="finding-box info">
                          <h4>Combinable Sections</h4>
                          <ul>{(meta.combinableParts || ["Combine introductions"]).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "shared" && (
                  <div className="collab-draft-card">
                    <div className="draft-card-header">
                      <div>
                        <h3>AI-Generated Improved Shared Draft</h3>
                        <span className="badge-ai">AI Combined</span>
                      </div>
                      {latestSharedDraft && (
                        <Button variant="primary" onClick={() => handleApplyDraft(latestSharedDraft.id)} disabled={applying}>
                          Apply to My Assignment
                        </Button>
                      )}
                    </div>
                    {latestSharedDraft ? (
                      <div className="draft-text-preview" dangerouslySetInnerHTML={{ __html: latestSharedDraft.content }} />
                    ) : (
                      <p className="empty-draft-note">No shared improved draft has been generated yet. Run comparison first.</p>
                    )}
                  </div>
                )}

                {activeTab === "differentiated" && (
                  <div className="collab-draft-card">
                    <div className="draft-card-header">
                      <div>
                        <h3>My Independent Differentiated Draft</h3>
                        <span className="badge-differentiated">Differentiated for Independent Work</span>
                      </div>
                      {latestDifferentiatedDraft && (
                        <Button variant="primary" onClick={() => handleApplyDraft(latestDifferentiatedDraft.id)} disabled={applying}>
                          Apply to My Assignment
                        </Button>
                      )}
                    </div>
                    {latestDifferentiatedDraft ? (
                      <div className="draft-text-preview" dangerouslySetInnerHTML={{ __html: latestDifferentiatedDraft.content }} />
                    ) : (
                      <div className="prompt-callout">
                        <Sparkles size={20} />
                        <p>Click <strong>"Create My Own Version"</strong> to produce an independently worded version of the shared draft that preserves your own style and emphasis.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
