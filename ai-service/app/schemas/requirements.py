from typing import Literal
from pydantic import BaseModel, Field

RequirementKind = Literal["concept", "section", "length", "sources", "deadline"]
RequirementStatus = Literal["not_checked", "met", "partial", "missing"]

class Requirement(BaseModel):
    id: str
    text: str
    kind: RequirementKind = "concept"
    status: RequirementStatus = "not_checked"
    evidence: str | None = None

class ExtractRequest(BaseModel):
    brief: str = Field(min_length=1, max_length=20000)
    targetWords: int = Field(default=0, ge=0)

class ExtractResponse(BaseModel):
    requirements: list[Requirement]
    confidence: float = Field(ge=0, le=1)
