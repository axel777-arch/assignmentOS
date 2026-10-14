import re
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.schemas.research import ResearchRequest, ResearchResponse
from app.services.research_service import answer_with_sources
from app.services.llm_service import complete

router = APIRouter(prefix="/api", tags=["research"])

class AssistantRequest(BaseModel):
    assignment: dict = Field(default_factory=dict)
    message: str = Field(min_length=1, max_length=2000)
    history: list[dict] = Field(default_factory=list)
    documentExcerpts: list[dict] = Field(default_factory=list)

@router.post("/research", response_model=ResearchResponse)
async def research(request: ResearchRequest):
    return await answer_with_sources(request)

@router.post("/assistant")
async def assistant(request: AssistantRequest):
    messages = []
    for h in request.history[-6:]:
        if isinstance(h, dict) and h.get("message"):
            role = "assistant" if h.get("role") == "assistant" else "user"
            messages.append({"role": role, "content": str(h.get("message"))})
    
    prompt = f"Assignment Context: {request.assignment}\nCourse Document Excerpts: {request.documentExcerpts}\nStudent Question: {request.message}"
    messages.append({"role": "user", "content": prompt})

    reply = await complete(messages)
    if reply:
        return {"reply": reply, "provider": "ai"}

    assignment = request.assignment
    requirements = assignment.get("requirements", []) if isinstance(assignment, dict) else []
    open_items = [item.get("text", "Review the assignment brief") for item in requirements if item.get("status") != "met"][:3]
    title = assignment.get("title") if isinstance(assignment, dict) else None
    question = request.message.strip()
    lowered = question.casefold()
    if re.search(r"source|citation|reference|evidence", lowered):
        guidance = "Choose a source you have actually read, identify the exact passage that supports your point, then explain the link in your own words."
        if assignment.get("sourceTarget"):
            guidance += f" Your brief asks for {assignment['sourceTarget']} sources, so compare your references list with that target."
    elif re.search(r"word|length|page|short|long", lowered):
        text = re.sub(r"<[^>]*>", " ", str(assignment.get("draft", "")))
        word_count = len(re.findall(r"\b[\w'-]+\b", text))
        guidance = f"Your saved draft is about {word_count} words. Check it against the brief's range, then expand the least-supported requirement instead of adding filler."
    elif re.search(r"explain|what is|how does|why does|concept", lowered):
        requested_topic = question[:180]
        guidance = f"For the concept in ‘{requested_topic}’, first write a one-sentence explanation from memory. Then compare each part with your course notes and mark what evidence or step is missing."
    elif re.search(r"next|start|priorit|revise|improve|missing|gap", lowered):
        if open_items:
            guidance = "Start with the requirement most central to your argument:\n" + "\n".join(f"- {item}" for item in open_items) + "\nChoose one, revise a short section, then check it against a course source."
        else:
            guidance = "Your checklist is marked complete. Re-read the brief for nuance, then challenge one claim in your draft with evidence from your course material."
    else:
        guidance = f"You asked: ‘{question[:240]}’. Turn that into one small question you can answer from your notes; I can help you outline the reasoning or compare it with a specific requirement."
    context = f"For ‘{title}’, " if title else "For your studies, "
    return {"reply": f"{context}{guidance}\n\nThis local fallback is based on your question and saved workspace; it is not a verified source or a completed assignment.", "provider": "local"}
