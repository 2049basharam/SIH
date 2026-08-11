import os
from typing import List

class Settings:
    PROJECT_NAME: str = "College Internal SIH Selection Portal"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super-secret-key-for-sih-portal-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180  # 3 hours for team and hackathon evaluation sessions
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sih.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv("BACKEND_CORS_ORIGINS", "*").split(",") if origin.strip()
    ]
    
    # SIH Synchronization Config
    SIH_SOURCE_URL: str = os.getenv("SIH_SOURCE_URL", "https://sih.gov.in/sih2025PS")
    SIH_API_URL: str = os.getenv("SIH_API_URL", "")
    SIH_SOURCE_EDITION: str = os.getenv("SIH_SOURCE_EDITION", "2026")
    SIH_SYNC_ENABLED: bool = os.getenv("SIH_SYNC_ENABLED", "true").lower() == "true"
    SIH_SYNC_INTERVAL: int = int(os.getenv("SIH_SYNC_INTERVAL", "86400"))  # once every 24 hours

    # AI Configuration
    AI_ENABLED: bool = os.getenv("AI_ENABLED", "true").lower() == "true"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # 'gemini', 'openai', 'mock'
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "gemini")  # 'gemini', 'mock'
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    AI_TIMEOUT: float = float(os.getenv("AI_TIMEOUT", "15.0"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "1200"))
    AI_CACHE_ENABLED: bool = os.getenv("AI_CACHE_ENABLED", "true").lower() == "true"

settings = Settings()

