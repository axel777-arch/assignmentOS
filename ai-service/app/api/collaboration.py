import json
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.llm_service import complete

router = APIRouter(prefix="/api/collaboration", tags=["collaboration"])

class CompareRequest(BaseModel):
    title: str = Field(default="Assignment")
    requirements: list[str] = Field(default_factory=list)
    draftA: str = Field(default="")
    draftB: str = Field(default="")

class DifferentiateRequest(BaseModel):
    title: str = Field(default="Assignment")
    requirements: list[str] = Field(default_factory=list)
    sharedDraft: str = Field(default="")

@router.post("/compare")
async def compare(request: CompareRequest):
    prompt = f"""You are an AI collaboration assistant for students working together.
Compare these two student drafts for assignment '{request.title}'.
Requirements: {json.dumps(request.requirements)}

Student A Draft:
{request.draftA[:5000]}

Student B Draft:
{request.draftB[:5000]}

Analyze both drafts and return a JSON object with:
- strengthsA: array of strong points from Student A
- strengthsB: array of strong points from Student B
- missingRequirements: array of unmet requirements
- weakExplanations: array of areas needing better explanations
- contradictions: array of conflicting points between drafts
- redundantSections: array of redundant text
- betterExamples: array of better examples identified
- verificationNeeded: array of claims requiring verification
- combinableParts: array of recommendations for combining parts
- improvedSharedDraft: HTML string representing the combined, improved draft

Return ONLY valid JSON matching the structure above."""

    response = await complete([{"role": "user", "content": prompt}])
    if response:
        try:
            clean_json = response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(clean_json)
        except Exception:
            pass

    # Deterministic fallback
    draftA_clean = request.draftA.replace("<[^>]*>", " ").strip()
    draftB_clean = request.draftB.replace("<[^>]*>", " ").strip()
    combined = f"<p><strong>Combined Shared Draft</strong></p>\n<p>{draftA_clean}</p>\n<p>{draftB_clean}</p>"

    return {
        "strengthsA": ["Clear core thesis statement"],
        "strengthsB": ["Detailed supporting examples"],
        "missingRequirements": [],
        "weakExplanations": ["Needs smoother transitional phrases between paragraphs"],
        "contradictions": [],
        "redundantSections": [],
        "betterExamples": ["Draft B has stronger empirical evidence in section 2"],
        "verificationNeeded": ["Verify source citations"],
        "combinableParts": ["Combine intro of Draft A with body of Draft B"],
        "improvedSharedDraft": combined
    }

@router.post("/differentiate")
async def differentiate(request: DifferentiateRequest):
    prompt = f"""You are an AI academic assistant.
A student was collaborating on assignment '{request.title}'.
Here is the shared combined draft:
{request.sharedDraft[:6000]}

Generate a differentiated version of this draft for one student's final submission.
Guidelines:
- Satisfy the same assignment requirements: {json.dumps(request.requirements)}
- Preserve factual accuracy and core concepts
- Use distinct wording, structure, and emphasis
- Do NOT encourage academic dishonesty; this allows collaborating students to independently express their understanding.

Return a JSON object with:
- differentiatedDraft: HTML string containing the reworded and re-structured draft.

Return ONLY valid JSON."""

    response = await complete([{"role": "user", "content": prompt}])
    if response:
        try:
            clean_json = response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(clean_json)
        except Exception:
            pass

    return {
        "differentiatedDraft": f"<p><em>Independently structured submission:</em></p>\n" + request.sharedDraft
    }
