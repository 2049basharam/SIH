import logging
from app.config import settings
from app.intelligence.provider import AIProvider
from app.intelligence.llm_provider import GeminiProvider, MockAIProvider

logger = logging.getLogger("sih-portal-intelligence")

def get_ai_provider() -> AIProvider:
    """
    Returns the configured AI Provider instance.
    If AI is disabled or the configuration lacks API keys,
    it falls back to MockAIProvider to ensure the app remains fully functional.
    """
    if not settings.AI_ENABLED:
        logger.info("AI features are disabled. Using MockAIProvider.")
        return MockAIProvider()
        
    provider_type = settings.AI_PROVIDER.lower().strip()
    
    if provider_type == "gemini":
        if not settings.AI_API_KEY:
            logger.warning("Gemini AI API key is missing. Falling back to MockAIProvider.")
            return MockAIProvider()
        return GeminiProvider()
    elif provider_type == "mock":
        return MockAIProvider()
    else:
        logger.warning(f"Unknown AI Provider '{settings.AI_PROVIDER}'. Defaulting to MockAIProvider.")
        return MockAIProvider()

# Global provider instance
ai_provider = get_ai_provider()
