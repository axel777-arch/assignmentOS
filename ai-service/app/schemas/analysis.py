from pydantic import BaseModel, Field
from app.schemas.requirements import Requirement

class AssignmentContext(BaseModel):
    id: str | None = None
    title: str = "Assignment"
    instructions: str = ""
    targetWords: int = 0
    minWords: int = 0
    maxWords: int = 0
    sourceTarget: int = 0
    requirements: list[Requirement] = []

class AnalysisRequest(BaseModel):
    assignment: AssignmentContext
    draft: str = Field(default="", max_length=500000)

class AnalysisItem(BaseModel):
    requirementId: str
    status: str
    evidence: str
    suggestion: str

class AnalysisResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    summary: str
    items: list[AnalysisItem]
    disclaimer: str = "This automated review is a study aid, not a grade. Verify each finding against the assignment brief."
