from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analysis, collaboration, health, requirements, research

app = FastAPI(title="AssignmentOS AI Service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
app.include_router(health.router)
app.include_router(requirements.router)
app.include_router(analysis.router)
app.include_router(research.router)
app.include_router(collaboration.router)
