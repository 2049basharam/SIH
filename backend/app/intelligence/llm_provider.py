import json
import re
import time
from typing import List, Type, Dict, Any
import httpx
from pydantic import BaseModel

from app.config import settings
from app.intelligence.provider import AIProvider

def clean_and_parse_json(text: str) -> dict:
    """Robust parser to extract JSON structures from free-form LLM texts."""
    cleaned = text.strip()
    # Try to find ```json ... ``` blocks
    json_block = re.search(r"```json\s*(.*?)\s*```", cleaned, re.DOTALL)
    if json_block:
        cleaned = json_block.group(1).strip()
    else:
        # Try finding raw curly braces structure
        braces = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if braces:
            cleaned = braces.group(1).strip()
    return json.loads(cleaned)


class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL
        self.embedding_model = settings.EMBEDDING_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def _get_headers(self) -> Dict[str, str]:
        return {"Content-Type": "application/json"}

    def generate(self, prompt: str, system_instruction: str = None) -> str:
        if not self.api_key:
            raise ValueError("Gemini API key is not configured")
            
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        
        payload: Dict[str, Any] = {}
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
            
        payload["contents"] = [
            {"parts": [{"text": prompt}]}
        ]
        
        with httpx.Client(timeout=settings.AI_TIMEOUT) as client:
            resp = client.post(url, json=payload, headers=self._get_headers())
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API Error {resp.status_code}: {resp.text}")
                
            data = resp.json()
            try:
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                return text_out
            except (KeyError, IndexError) as e:
                raise RuntimeError(f"Unexpected response format from Gemini: {data}") from e

    def generate_structured(self, prompt: str, response_schema: Type[BaseModel], system_instruction: str = None) -> BaseModel:
        if not self.api_key:
            raise ValueError("Gemini API key is not configured")
            
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        
        payload: Dict[str, Any] = {}
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
            
        # Append structure instructions to prompt
        prompt_with_instructions = (
            f"{prompt}\n\n"
            f"You MUST respond ONLY with a single valid JSON object. "
            f"Do not write any explanation outside the JSON block. "
            f"The JSON output must strictly comply with the following JSON schema:\n"
            f"{json.dumps(response_schema.model_json_schema())}"
        )
        
        payload["contents"] = [
            {"parts": [{"text": prompt_with_instructions}]}
        ]
        
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }
        
        with httpx.Client(timeout=settings.AI_TIMEOUT) as client:
            resp = client.post(url, json=payload, headers=self._get_headers())
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API Error {resp.status_code}: {resp.text}")
                
            data = resp.json()
            try:
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = clean_and_parse_json(text_out)
                return response_schema.model_validate(parsed_json)
            except Exception as e:
                # If JSON parsing or model validation fails, raise clean error
                raise RuntimeError(f"Failed to generate structured schema output: {e}. Raw response: {data}") from e

    def embed(self, text: str) -> List[float]:
        if not self.api_key:
            raise ValueError("Gemini API key is not configured")
            
        url = f"{self.base_url}/models/{self.embedding_model}:embedContent?key={self.api_key}"
        payload = {
            "content": {
                "parts": [{"text": text}]
            }
        }
        
        with httpx.Client(timeout=settings.AI_TIMEOUT) as client:
            resp = client.post(url, json=payload, headers=self._get_headers())
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini Embedding Error {resp.status_code}: {resp.text}")
                
            data = resp.json()
            try:
                return data["embedding"]["values"]
            except KeyError as e:
                raise RuntimeError(f"Unexpected embedding format: {data}") from e


class MockAIProvider(AIProvider):
    def generate(self, prompt: str, system_instruction: str = None) -> str:
        time.sleep(0.2) # simulate latency
        return f"Mock response for: {prompt[:60]}..."

    def generate_structured(self, prompt: str, response_schema: Type[BaseModel], system_instruction: str = None) -> BaseModel:
        time.sleep(0.3)
        schema_name = response_schema.__name__.lower()
        
        # Populate realistic mock data depending on the schema requested
        mock_data: Dict[str, Any] = {}
        
        if "recs" in schema_name or "recommendation" in schema_name:
            mock_data = {
                "analysis": "Semantic matching shows high relevance to rural and mobile vision themes.",
                "confidence": 0.91,
                "confidence_level": "HIGH",
                "recommendations": [
                    {
                        "problem_statement_id": 1,
                        "problem_id": "SIH25024",
                        "match_score": 0.94,
                        "explanation": "Matches your mobile camera scanning vision project and AI medicinal plant catalog idea.",
                        "evidence": ["AI", "Mobile app", "Scan"],
                        "warnings": []
                    },
                    {
                        "problem_statement_id": 2,
                        "problem_id": "SIH25022",
                        "match_score": 0.72,
                        "explanation": "Weak match. This is for railways scheduling, which is remote from your agricultural focus.",
                        "evidence": ["Scheduling"],
                        "warnings": ["Focus mismatch"]
                    }
                ],
                "evidence": ["Agricultural image vision matching"],
                "warnings": []
            }
        elif "explain" in schema_name:
            mock_data = {
                "summary": "This problem seeks to build an AI camera application to identify medicinal plants on the go, providing local metadata details.",
                "target_users": "Ayurveda practitioners, agricultural researchers, rural citizens.",
                "constraints": ["Must work on low-spec mobile devices", "Offline cache capacity preferred"],
                "approaches": ["TensorFlow Lite object detection", "Flutter cross-platform app framework"],
                "skills": ["Python", "TensorFlow", "Dart", "Mobile UX"],
                "difficulty_analysis": {
                    "technical_complexity": 8.0,
                    "data_complexity": 7.0,
                    "implementation_difficulty": 6.0,
                    "research_requirement": 7.0,
                    "hardware_requirement": 1.0
                },
                "confidence": 0.95,
                "confidence_level": "HIGH"
            }
        elif "compatibility" in schema_name:
            mock_data = {
                "match_percentage": 87.5,
                "confidence": 0.92,
                "confidence_level": "HIGH",
                "matching_skills": ["Python", "Machine Learning", "FastAPI"],
                "missing_skills": ["TensorFlow Lite (Mobile deployment)"],
                "advisory_summary": "Highly compatible technical stack. Adding a member with Mobile/Flutter expertise would cover the deployment requirements."
            }
        elif "composition" in schema_name:
            mock_data = {
                "eligible": True,
                "technical_diversity": "HIGH",
                "domain_diversity": "MEDIUM",
                "role_coverage": "HIGH",
                "gaps": ["Lacks dedicated hardware/IoT engineering skills. Consider onboarding EEE/ECE support if hardware prototype is required."],
                "warnings": [],
                "confidence": 0.95,
                "confidence_level": "HIGH"
            }
        elif "similarity" in schema_name:
            mock_data = {
                "is_similar": True,
                "similar_teams": [
                    {"team_id": 99, "name": "The Innovators", "similarity_score": 0.95}
                ],
                "warning_message": "Very similar to existing team name 'The Innovators'. Consider choosing a more distinctive name to stand out."
            }
        elif "readiness" in schema_name:
            mock_data = {
                "readiness_score": 82.0,
                "confidence": 0.88,
                "confidence_level": "HIGH",
                "metrics": {
                    "problem_understanding": 90.0,
                    "solution_clarity": 85.0,
                    "technical_detail": 80.0,
                    "innovation": 75.0,
                    "implementation": 80.0,
                    "documentation": 70.0
                },
                "gaps": [
                    "Missing clear quantitative impact metrics",
                    "Deployment and scalability plan could benefit from cloud architecture diagrams"
                ],
                "repository_health": {
                    "readme_score": 85.0,
                    "documentation_score": 75.0,
                    "structure_score": 90.0,
                    "testing_score": 50.0,
                    "recommendations": ["Add setup instructions", "Include test executions log"]
                }
            }
        elif "assist" in schema_name:
            mock_data = {
                "summary": "This team proposed an offline-capable Flutter app scanning plant leaves with a quantized MobileNet model on device.",
                "evidence_found": {
                    "technical_feasibility": "Includes TensorFlow Lite, Flutter repository files, and API structures.",
                    "innovation": "Proposes on-device local database caches for offline rural use."
                },
                "concerns": [
                    "Model training dataset size is not clearly specified in the text document.",
                    "No load testing evidence found."
                ],
                "confidence": 0.89,
                "confidence_level": "HIGH"
            }
        elif "anomaly" in schema_name:
            mock_data = {
                "anomalies_detected": [
                    {
                        "severity": "MEDIUM",
                        "type": "EVALUATION_VARIANCE",
                        "description": "Team 'Alpha' score variance is high. Judge A scored 90, Judge C scored 55. Review is recommended.",
                        "metadata": {"team_id": 1, "variance": 18.5}
                    }
                ],
                "risk_index": 45.0,
                "summary": "1 outlier variance evaluation alert detected. No administrative script anomalies checked."
            }
        elif "announcement" in schema_name:
            mock_data = {
                "draft": "Important Notification: SIH Internal Selection Submissions Closing\n\nDear Teams,\nThis is a final reminder that the portal will stop accepting submissions tomorrow. Please verify that your GitHub repository links are set to public and your PPT slides are uploaded before the cutoff.\n\nBest regards,\nHackathon Coordinator Team"
            }
        else:
            # Fallback mock generator using schema definition
            mock_data = {}
            for name, field in response_schema.model_fields.items():
                if field.annotation == str:
                    mock_data[name] = "Mock text"
                elif field.annotation == float or field.annotation == int:
                    mock_data[name] = 1.0
                elif field.annotation == bool:
                    mock_data[name] = True
                elif getattr(field.annotation, "__origin__", None) == list:
                    mock_data[name] = []
                else:
                    mock_data[name] = None
                    
        return response_schema.model_validate(mock_data)

    def embed(self, text: str) -> List[float]:
        # Return deterministic mock vector of dimension 1536/768
        time.sleep(0.05)
        val = sum(ord(c) for c in text) % 100 / 100.0
        return [val] * 768
