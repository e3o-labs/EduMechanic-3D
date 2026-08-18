import os
from typing import Optional
from pydantic import BaseModel

class Settings(BaseModel):
    # API Keys
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")

    # Provider & Model Settings
    VLM_PROVIDER: str = os.getenv("VLM_PROVIDER", "auto") # auto, gemini, openai, anthropic, mock
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    # Global Mechanical Tolerance (mm)
    DEFAULT_TOLERANCE: float = float(os.getenv("DEFAULT_TOLERANCE", "0.20"))

    def get_active_provider(self) -> str:
        if self.VLM_PROVIDER != "auto":
            return self.VLM_PROVIDER.lower()
        if self.GEMINI_API_KEY:
            return "gemini"
        if self.OPENAI_API_KEY:
            return "openai"
        if self.ANTHROPIC_API_KEY:
            return "anthropic"
        return "mock"

settings = Settings()
