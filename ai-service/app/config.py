import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    provider: str = os.getenv("AI_PROVIDER", "ollama").lower()
    api_key: str = os.getenv("AI_API_KEY", "")
    base_url: str = os.getenv("AI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
