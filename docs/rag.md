# Document Search and RAG

The current document service accepts text-selectable PDFs only. It validates the upload, extracts text page by page with pypdf, preserves the page number, chunks long page text with overlap, and stores an assignment-scoped JSON index in the local document volume. It does not persist the original PDF yet. Keyword search ranks matching pages by query-term overlap and returns the original filename and page metadata.

The AI research endpoint can accept retrieved passages and produce an answer only from those passages. Each citation should identify its document and page, and the endpoint should say when the supplied text is insufficient. Search alone does not establish that a claim is accurate.

OCR is intentionally not implemented; scanned PDFs return a clear error. Embedding generation raises `NotImplementedError` until an actual provider and model are configured. The PostgreSQL chunk schema reserves `vector(1536)` but current retrieval does not query pgvector.

Evaluation checklist:

- Confirm the expected page and original filename survive extraction/search.
- Check correct-page recall and unrelated-result rates across representative material.
- Confirm duplicate pages/chunks do not produce unstable results.
- Verify answers cite only returned passages and disclose insufficient evidence.
- Test oversized, malformed, encrypted, blank, and scanned PDFs.
