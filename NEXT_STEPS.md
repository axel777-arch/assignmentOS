# AssignmentOS Next Steps

This roadmap is separate from the product and architecture documentation. Work top to bottom: keep the complete student workflow reliable before adding more AI surface area.

## 1. Harden the hackathon demo

- [ ] Test PDF upload with a small, selectable-text PDF and verify multiple search results retain the correct filename and page number.
- [ ] Test an empty draft, a draft that meets its word target, headings, references, malformed PDFs, and a PDF above the size limit.
- [ ] Add focused tests for numeric and spelled-out quantities, multiple action clauses, required sections, and ambiguous briefs.
- [ ] Tighten requirement extraction for pluralization, lists, page ranges, deadlines, and subject-specific language; preserve the editable fallback when confidence is low.
- [ ] Check the full workflow at desktop, tablet, and phone widths, including keyboard access and reduced-motion settings.
- [ ] Rehearse the demo loop: paste a brief, confirm requirements, write, search the course PDF, analyze a gap, revise, analyze again, export.

## 2. Connect shared persistence and APIs

- [ ] Scaffold the proposed Next.js/TypeScript client and a Node API, keeping the browser's UI independent from backend implementation details.
- [ ] Add PostgreSQL migrations for users, assignments, requirements, drafts, and document metadata.
- [ ] Implement authentication, authorization, assignment ownership checks, request validation, and per-user rate limits.
- [ ] Persist assignments and drafts; add safe rich-text sanitization, conflict handling, and draft snapshots.
- [ ] Publish OpenAPI contracts and local run instructions for each independently owned service.
- [ ] Keep a mock-data mode so frontend work remains possible while services are offline.

## 3. Replace heuristics with inspectable intelligence

- [ ] Create a Python/FastAPI AI service for structured requirement extraction and requirement-versus-draft analysis.
- [ ] Version prompts and response schemas. Include confidence, supporting draft evidence, and explicit uncertainty for each result.
- [ ] Build an evaluation set with science, mathematics, humanities, and general research briefs plus intentionally incomplete drafts.
- [ ] Compare false positives and false negatives before using a model response in the UI; retain editable requirements and deterministic length checks.
- [ ] Keep academic-integrity behavior centered on explanation, evidence, planning, and student revision.

## 4. Improve document search and research

- [ ] Move uploaded originals to private object storage; enforce file type/size limits and user ownership at the API boundary.
- [ ] Extract text page by page in a document service and add processing status, retry handling, and cleanup of failed uploads.
- [ ] Add PostgreSQL full-text search first; introduce embeddings and pgvector when a small retrieval evaluation set demonstrates a benefit.
- [ ] Return source excerpts with file, page, and retrieval metadata; evaluate relevant-page ranking and unrelated-result rates.
- [ ] Add OCR for scanned notes only after the text-based pipeline is stable.
- [ ] Add a retrieval-grounded research assistant and citation assistance only when every claim can expose its source passage.

## 5. Expand the student workflow

- [ ] Add named drafts, automatic snapshots, side-by-side comparisons, and requirement-status change history.
- [ ] Generate a lightweight assignment timeline from due date and requirements: research, outline, first draft, revision, and final review.
- [ ] Add formatted PDF/DOCX export after document persistence and editor formatting are stable.
- [ ] Consider teacher or school workflows only after single-student ownership, privacy, and source traceability are reliable.

## Suggested five-day team sequence

| Day | Outcome |
| --- | --- |
| 1 | Agree on schemas and API contracts; keep the browser prototype as the shared UX reference. |
| 2 | Implement assignment persistence and requirement extraction behind documented interfaces. |
| 3 | Add PDF ingestion, page-aware keyword search, and the deterministic analyzer. |
| 4 | Integrate services, evaluate representative briefs, and fix the most visible false positives. |
| 5 | Run the end-to-end demo, verify deployment and environment secrets, and rehearse the revision loop. |

For a three-day event, use one subject and one sample textbook, keep authentication minimal, and defer OCR, web research, citations, and draft comparison. The non-negotiable outcome is one functioning loop from assignment instructions to student revision.