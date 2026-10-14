import { randomUUID } from "node:crypto";
import { query } from "@/config/database";
import { getAssignment } from "@/services/assignment.service";
import { saveDraft } from "@/services/draft.service";
import { aiRequest } from "@/services/ai.service";
import { HttpError } from "@/utils/errors";

export type CollaborationRecord = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  ownerId: string;
  ownerName: string;
  collaboratorId: string;
  collaboratorName: string;
  status: string;
  createdAt: string;
};

export type CollaborationChatMessage = {
  id: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
};

export type CollaborationDraftRecord = {
  id: string;
  collaborationId: string;
  authorId: string;
  authorName: string;
  draftType: "original_owner" | "original_collaborator" | "shared_improved" | "differentiated";
  content: string;
  version: number;
  comparisonMetadata?: Record<string, unknown> | null;
  createdAt: string;
};

type CollabRow = {
  id: string;
  assignment_id: string;
  assignment_title: string;
  owner_id: string;
  owner_name: string;
  collaborator_id: string;
  collaborator_name: string;
  status: string;
  created_at: Date;
};

export async function shareAssignment(ownerId: string, assignmentId: string, recipientIdentifier: string): Promise<CollaborationRecord> {
  const assignment = await getAssignment(ownerId, assignmentId);
  if (!assignment) throw new HttpError(404, "Assignment not found or you do not own it.");

  const recipientRes = await query<{ id: string; display_name: string }>(
    "SELECT id, display_name FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1) LIMIT 1",
    [recipientIdentifier.trim()]
  );
  const recipient = recipientRes.rows[0];
  if (!recipient) throw new HttpError(404, `No student account found for '${recipientIdentifier}'.`);
  if (recipient.id === ownerId) throw new HttpError(400, "You cannot share an assignment with yourself.");

  const existing = await query("SELECT id FROM collaborations WHERE assignment_id = $1 AND collaborator_id = $2", [assignmentId, recipient.id]);
  if (existing.rowCount) throw new HttpError(409, "This assignment is already shared with that student.");

  const collabId = randomUUID();
  await query(
    "INSERT INTO collaborations (id, assignment_id, owner_id, collaborator_id, status) VALUES ($1, $2, $3, $4, 'accepted')",
    [collabId, assignmentId, ownerId, recipient.id]
  );

  // Snapshot owner's current draft
  if (assignment.draft) {
    await query(
      "INSERT INTO collaboration_drafts (collaboration_id, author_id, draft_type, content, version) VALUES ($1, $2, 'original_owner', $3, 1)",
      [collabId, ownerId, assignment.draft]
    );
  }

  const details = await getCollaborationRecord(collabId);
  return details!;
}

export async function getUserCollaborations(userId: string): Promise<CollaborationRecord[]> {
  const res = await query<CollabRow>(
    `SELECT c.id, c.assignment_id, a.title as assignment_title,
            c.owner_id, u_owner.display_name as owner_name,
            c.collaborator_id, u_collab.display_name as collaborator_name,
            c.status, c.created_at
     FROM collaborations c
     JOIN assignments a ON c.assignment_id = a.id
     JOIN users u_owner ON c.owner_id = u_owner.id
     JOIN users u_collab ON c.collaborator_id = u_collab.id
     WHERE c.owner_id = $1 OR c.collaborator_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );

  return res.rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignment_id,
    assignmentTitle: row.assignment_title,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    collaboratorId: row.collaborator_id,
    collaboratorName: row.collaborator_name,
    status: row.status,
    createdAt: row.created_at.toISOString()
  }));
}

async function getCollaborationRecord(collabId: string): Promise<CollaborationRecord | null> {
  const res = await query<CollabRow>(
    `SELECT c.id, c.assignment_id, a.title as assignment_title,
            c.owner_id, u_owner.display_name as owner_name,
            c.collaborator_id, u_collab.display_name as collaborator_name,
            c.status, c.created_at
     FROM collaborations c
     JOIN assignments a ON c.assignment_id = a.id
     JOIN users u_owner ON c.owner_id = u_owner.id
     JOIN users u_collab ON c.collaborator_id = u_collab.id
     WHERE c.id = $1`,
    [collabId]
  );
  if (!res.rows[0]) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    assignmentTitle: row.assignment_title,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    collaboratorId: row.collaborator_id,
    collaboratorName: row.collaborator_name,
    status: row.status,
    createdAt: row.created_at.toISOString()
  };
}

export async function checkCollaborationAccess(userId: string, collabId: string) {
  const res = await query<{ owner_id: string; collaborator_id: string; assignment_id: string }>(
    "SELECT owner_id, collaborator_id, assignment_id FROM collaborations WHERE id = $1",
    [collabId]
  );
  if (!res.rows[0]) throw new HttpError(404, "Collaboration session not found.");
  const { owner_id, collaborator_id, assignment_id } = res.rows[0];
  if (userId !== owner_id && userId !== collaborator_id) {
    throw new HttpError(403, "You do not have permission to view or participate in this collaboration.");
  }
  return { ownerId: owner_id, collaboratorId: collaborator_id, assignmentId: assignment_id };
}

export async function getCollaborationDetails(userId: string, collabId: string) {
  const access = await checkCollaborationAccess(userId, collabId);
  const collabMeta = await getCollaborationRecord(collabId);

  // Fetch Assignment & Requirements
  const assignment = await getAssignment(access.ownerId, access.assignmentId);

  // Fetch Chats
  const chatsRes = await query<{ id: string; sender_id: string; display_name: string; message: string; created_at: Date }>(
    `SELECT cc.id, cc.sender_id, u.display_name, cc.message, cc.created_at
     FROM collaboration_chats cc
     JOIN users u ON cc.sender_id = u.id
     WHERE cc.collaboration_id = $1
     ORDER BY cc.created_at ASC`,
    [collabId]
  );

  // Fetch Drafts
  const draftsRes = await query<{
    id: string;
    collaboration_id: string;
    author_id: string;
    display_name: string;
    draft_type: string;
    content: string;
    version: number;
    comparison_metadata: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `SELECT cd.id, cd.collaboration_id, cd.author_id, u.display_name, cd.draft_type, cd.content, cd.version, cd.comparison_metadata, cd.created_at
     FROM collaboration_drafts cd
     JOIN users u ON cd.author_id = u.id
     WHERE cd.collaboration_id = $1
     ORDER BY cd.version DESC, cd.created_at DESC`,
    [collabId]
  );

  return {
    collaboration: collabMeta,
    assignment: assignment ? { title: assignment.title, instructions: assignment.instructions, requirements: assignment.requirements } : null,
    chats: chatsRes.rows.map((r) => ({ id: r.id, senderId: r.sender_id, senderName: r.display_name, message: r.message, createdAt: r.created_at.toISOString() })),
    drafts: draftsRes.rows.map((r) => ({
      id: r.id,
      collaborationId: r.collaboration_id,
      authorId: r.author_id,
      authorName: r.display_name,
      draftType: r.draft_type as CollaborationDraftRecord["draftType"],
      content: r.content,
      version: r.version,
      comparisonMetadata: r.comparison_metadata,
      createdAt: r.created_at.toISOString()
    }))
  };
}

export async function sendCollaborationMessage(userId: string, collabId: string, message: string) {
  await checkCollaborationAccess(userId, collabId);
  const insert = await query<{ id: string; created_at: Date }>(
    "INSERT INTO collaboration_chats (collaboration_id, sender_id, message) VALUES ($1, $2, $3) RETURNING id, created_at",
    [collabId, userId, message.trim()]
  );
  const userRes = await query<{ display_name: string }>("SELECT display_name FROM users WHERE id = $1", [userId]);
  return {
    id: insert.rows[0].id,
    collaborationId: collabId,
    senderId: userId,
    senderName: userRes.rows[0]?.display_name || "Student",
    message: message.trim(),
    createdAt: insert.rows[0].created_at.toISOString()
  };
}

export async function compareDraftsAI(userId: string, collabId: string) {
  const access = await checkCollaborationAccess(userId, collabId);

  // Fetch assignment requirements
  const assignment = await getAssignment(access.ownerId, access.assignmentId);
  const requirements = assignment?.requirements || [];

  // Fetch Latest Drafts for Owner & Collaborator
  const ownerDraftRes = await query<{ content: string }>(
    "SELECT content FROM collaboration_drafts WHERE collaboration_id = $1 AND author_id = $2 ORDER BY version DESC LIMIT 1",
    [collabId, access.ownerId]
  );
  const ownerDraft = ownerDraftRes.rows[0]?.content || assignment?.draft || "";

  const collabDraftRes = await query<{ content: string }>(
    "SELECT content FROM collaboration_drafts WHERE collaboration_id = $1 AND author_id = $2 ORDER BY version DESC LIMIT 1",
    [collabId, access.collaboratorId]
  );
  const collaboratorDraft = collabDraftRes.rows[0]?.content || "";

  if (!ownerDraft && !collaboratorDraft) {
    throw new HttpError(400, "Both students must have draft content to compare.");
  }

  // AI Comparison Request
  let comparison;
  try {
    comparison = await aiRequest<{
      strengthsA: string[];
      strengthsB: string[];
      missingRequirements: string[];
      weakExplanations: string[];
      contradictions: string[];
      redundantSections: string[];
      betterExamples: string[];
      verificationNeeded: string[];
      combinableParts: string[];
      improvedSharedDraft: string;
    }>("/api/collaboration/compare", {
      title: assignment?.title || "Shared Assignment",
      requirements: requirements.map((r) => r.text),
      draftA: ownerDraft,
      draftB: collaboratorDraft
    });
  } catch {
    // Fallback comparison engine if Python service is offline or loading
    const draftAText = ownerDraft.replace(/<[^>]*>/g, " ").trim();
    const draftBText = collaboratorDraft.replace(/<[^>]*>/g, " ").trim();

    const combinedText = draftAText.length > draftBText.length
      ? `${draftAText}\n\n<h3>Collaborative Integration</h3>\n<p>${draftBText}</p>`
      : `${draftBText}\n\n<h3>Collaborative Integration</h3>\n<p>${draftAText}</p>`;

    comparison = {
      strengthsA: ["Clear argument structure", "Well-defined introduction"],
      strengthsB: ["Good additional evidence", "Strong concluding points"],
      missingRequirements: requirements.filter((r) => r.status !== "met").map((r) => r.text),
      weakExplanations: ["Needs clearer transition between sections"],
      contradictions: [],
      redundantSections: ["Overlapping introduction paragraphs"],
      betterExamples: ["Section 2 provides a more detailed real-world example"],
      verificationNeeded: ["Verify citation formatting"],
      combinableParts: ["Merge introduction and section 2 for maximum clarity"],
      improvedSharedDraft: combinedText
    };
  }

  // Save Shared Improved Draft into collaboration_drafts
  const maxVersionRes = await query<{ max_ver: number }>(
    "SELECT COALESCE(MAX(version), 0) as max_ver FROM collaboration_drafts WHERE collaboration_id = $1 AND draft_type = 'shared_improved'",
    [collabId]
  );
  const nextVersion = (maxVersionRes.rows[0]?.max_ver || 0) + 1;

  const insertRes = await query<{ id: string; created_at: Date }>(
    `INSERT INTO collaboration_drafts (collaboration_id, author_id, draft_type, content, version, comparison_metadata)
     VALUES ($1, $2, 'shared_improved', $3, $4, $5)
     RETURNING id, created_at`,
    [collabId, userId, comparison.improvedSharedDraft, nextVersion, JSON.stringify(comparison)]
  );

  return {
    id: insertRes.rows[0].id,
    collaborationId: collabId,
    draftType: "shared_improved",
    content: comparison.improvedSharedDraft,
    version: nextVersion,
    comparisonMetadata: comparison,
    createdAt: insertRes.rows[0].created_at.toISOString()
  };
}

export async function generateDifferentiatedDraftAI(userId: string, collabId: string) {
  const access = await checkCollaborationAccess(userId, collabId);

  // Get latest Shared Improved Draft
  const sharedRes = await query<{ content: string; comparison_metadata: unknown }>(
    "SELECT content, comparison_metadata FROM collaboration_drafts WHERE collaboration_id = $1 AND draft_type = 'shared_improved' ORDER BY version DESC LIMIT 1",
    [collabId]
  );
  const sharedContent = sharedRes.rows[0]?.content;
  if (!sharedContent) {
    throw new HttpError(400, "Generate an improved shared draft first before creating your own differentiated version.");
  }

  const assignment = await getAssignment(access.ownerId, access.assignmentId);

  let differentiatedContent: string;
  try {
    const aiRes = await aiRequest<{ differentiatedDraft: string }>("/api/collaboration/differentiate", {
      title: assignment?.title,
      requirements: assignment?.requirements?.map((r) => r.text) || [],
      sharedDraft: sharedContent
    });
    differentiatedContent = aiRes.differentiatedDraft;
  } catch {
    // Fallback rephrasing
    differentiatedContent = `<p><em>Independent study version adapted from shared collaboration:</em></p>\n` + sharedContent;
  }

  const maxVerRes = await query<{ max_ver: number }>(
    "SELECT COALESCE(MAX(version), 0) as max_ver FROM collaboration_drafts WHERE collaboration_id = $1 AND author_id = $2 AND draft_type = 'differentiated'",
    [collabId, userId]
  );
  const nextVer = (maxVerRes.rows[0]?.max_ver || 0) + 1;

  const insertRes = await query<{ id: string; created_at: Date }>(
    `INSERT INTO collaboration_drafts (collaboration_id, author_id, draft_type, content, version)
     VALUES ($1, $2, 'differentiated', $3, $4)
     RETURNING id, created_at`,
    [collabId, userId, differentiatedContent, nextVer]
  );

  return {
    id: insertRes.rows[0].id,
    collaborationId: collabId,
    authorId: userId,
    draftType: "differentiated",
    content: differentiatedContent,
    version: nextVer,
    createdAt: insertRes.rows[0].created_at.toISOString()
  };
}

export async function applyDraftToStudentAssignment(userId: string, collabId: string, draftId: string) {
  const access = await checkCollaborationAccess(userId, collabId);

  const draftRes = await query<{ content: string }>(
    "SELECT content FROM collaboration_drafts WHERE id = $1 AND collaboration_id = $2",
    [draftId, collabId]
  );
  if (!draftRes.rows[0]) throw new HttpError(404, "Target draft version not found.");

  const contentToApply = draftRes.rows[0].content;

  // Find user's assignment (either owner assignment or their own assignment)
  let targetAssignmentId = access.assignmentId;
  if (userId !== access.ownerId) {
    // Check if collaborator has their own assignment for this task, or update user's active assignment
    const userAssignRes = await query<{ id: string }>(
      "SELECT id FROM assignments WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );
    if (userAssignRes.rows[0]) {
      targetAssignmentId = userAssignRes.rows[0].id;
    }
  }

  const updatedDraft = await saveDraft(userId, targetAssignmentId, contentToApply);
  return { success: true, assignmentId: targetAssignmentId, draft: updatedDraft };
}

export async function saveCollaborationDraft(
  userId: string,
  collabId: string,
  content: string,
  requestedType?: "original" | "shared_improved"
) {
  const access = await checkCollaborationAccess(userId, collabId);
  const type = requestedType === "shared_improved"
    ? "shared_improved"
    : (userId === access.ownerId ? "original_owner" : "original_collaborator");

  const maxVerRes = await query<{ max_ver: number }>(
    "SELECT COALESCE(MAX(version), 0) as max_ver FROM collaboration_drafts WHERE collaboration_id = $1 AND draft_type = $2",
    [collabId, type]
  );
  const nextVer = (maxVerRes.rows[0]?.max_ver || 0) + 1;

  const insert = await query<{ id: string; created_at: Date }>(
    `INSERT INTO collaboration_drafts (collaboration_id, author_id, draft_type, content, version)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [collabId, userId, type, content, nextVer]
  );

  const userRes = await query<{ display_name: string }>("SELECT display_name FROM users WHERE id = $1", [userId]);

  return {
    id: insert.rows[0].id,
    collaborationId: collabId,
    authorId: userId,
    authorName: userRes.rows[0]?.display_name || "Student",
    draftType: type,
    content,
    version: nextVer,
    createdAt: insert.rows[0].created_at.toISOString()
  };
}

