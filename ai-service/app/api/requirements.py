from fastapi import APIRouter
from app.schemas.requirements import ExtractRequest, ExtractResponse
from app.services.requirement_extractor import extract_with_model

router = APIRouter(prefix="/api/requirements", tags=["requirements"])

@router.post("/extract", response_model=ExtractResponse)
async def extract(request: ExtractRequest):
    items, confidence = await extract_with_model(request.brief, request.targetWords)
    return ExtractResponse(requirements=items, confidence=confidence)
