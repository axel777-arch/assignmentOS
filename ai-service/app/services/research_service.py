from app.schemas.research import ResearchRequest, ResearchResponse
from app.services.llm_service import complete

async def answer_with_sources(request: ResearchRequest) -> ResearchResponse:
    if not request.passages:
        return ResearchResponse(answer="No course-material passages were provided. Search an uploaded PDF first, then inspect the page references before relying on a source.", sources=[])
    context = "\n\n".join(f"[{item.documentName}, page {item.page}] {item.text}" for item in request.passages)
    generated = await complete([
        {"role": "user", "content": f"Answer the student's question only from the excerpts below. If they do not support an answer, say so. Cite each supported point inline using the document title and page.\n\nQuestion: {request.query}\n\nExcerpts:\n{context}"}
    ])
    if generated:
        return ResearchResponse(answer=generated, sources=request.passages, provider="ai")
    excerpts = "\n".join(f"- {item.documentName}, page {item.page}: {item.text[:400]}" for item in request.passages[:5])
    return ResearchResponse(answer=f"Here are matching course passages for '{request.query}'. Check each page in the source before using it:\n{excerpts}", sources=request.passages, provider="local")
