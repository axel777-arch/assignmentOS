from pydantic import BaseModel, Field

class ResearchPassage(BaseModel):
    documentName: str
    page: int = Field(gt=0)
    text: str = Field(max_length=12000)

class ResearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    passages: list[ResearchPassage] = Field(default_factory=list, max_length=12)

class ResearchResponse(BaseModel):
    answer: str
    sources: list[ResearchPassage]
    provider: str = "local"
