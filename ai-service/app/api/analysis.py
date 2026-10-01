from fastapi import APIRouter
import json
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.assignment_analyzer import analyze_assignment
from app.services.llm_service import complete

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    result = analyze_assignment(request.assignment, request.draft)
    if not request.assignment.requirements:
        return result
    context = {
        "title": request.assignment.title,
        "brief": request.assignment.instructions[:4000],
        "requirements": [item.model_dump() for item in request.assignment.requirements],
        "draft": request.draft[:9000],
        "deterministic_findings": [item.model_dump() for item in result.items]
    }
    generated = await complete([{"role": "user", "content": "Improve only the evidence wording and revision suggestions for the supplied deterministic findings. Return a JSON object with an items array containing requirementId, evidence, and suggestion. Do not change statuses or score; do not infer a requirement is met from keyword presence alone. If evidence is uncertain, say so. Context: " + json.dumps(context, ensure_ascii=False)}])
    if not generated:
        return result
    try:
        payload = json.loads(generated.strip().removeprefix("```json").removesuffix("```").strip())
        revised = {item.get("requirementId"): item for item in payload.get("items", []) if isinstance(item, dict)}
        for item in result.items:
            candidate = revised.get(item.requirementId)
            if candidate:
                if isinstance(candidate.get("evidence"), str): item.evidence = candidate["evidence"][:1000]
                if isinstance(candidate.get("suggestion"), str): item.suggestion = candidate["suggestion"][:1000]
    except (json.JSONDecodeError, AttributeError, TypeError):
        pass
    return result
