from typing import List, Type
from pydantic import BaseModel

class AIProvider:
    def generate(self, prompt: str, system_instruction: str = None) -> str:
        """Generates standard free-text LLM response."""
        raise NotImplementedError
        
    def generate_structured(self, prompt: str, response_schema: Type[BaseModel], system_instruction: str = None) -> BaseModel:
        """Generates schema-validated JSON output from LLM, mapped to a Pydantic model."""
        raise NotImplementedError
        
    def embed(self, text: str) -> List[float]:
        """Generates vector embeddings for semantic searches."""
        raise NotImplementedError
