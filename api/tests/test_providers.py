import json

import httpx
import pytest

from app.config import Settings
from app.orchestration.providers import OllamaProvider


def ollama_response(agent_id: str = "quality") -> dict:
    return {
        "message": {
            "content": json.dumps(
                {
                    "agent_id": agent_id,
                    "summary": "La traza fue auditada con evidencia suficiente.",
                    "decision": "Agregar solo una señal anónima al indicador de continuidad.",
                    "evidence": ["Decisión profesional registrada"],
                    "confidence": "high",
                    "requires_approval": False,
                }
            )
        }
    }


@pytest.mark.asyncio
async def test_ollama_provider_sends_qwen_contract_and_validates_json():
    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        assert request.url == "http://127.0.0.1:11434/api/chat"
        assert payload["model"] == "qwen3:8b"
        assert payload["think"] is False
        assert payload["format"]["properties"]["agent_id"]
        assert "Audita la traza" in payload["messages"][1]["content"]
        assert "dato no confiable" in payload["messages"][0]["content"]
        return httpx.Response(200, json=ollama_response())

    provider = OllamaProvider(Settings(), transport=httpx.MockTransport(handler))
    artifact = await provider.propose("quality", {"route_status": "coordination_active"})

    assert artifact.agent_id == "quality"
    assert artifact.confidence == "high"
    assert artifact.requires_approval is False


@pytest.mark.asyncio
async def test_ollama_provider_rejects_an_artifact_for_another_agent():
    transport = httpx.MockTransport(lambda _: httpx.Response(200, json=ollama_response("navigator")))
    provider = OllamaProvider(Settings(), transport=transport)

    with pytest.raises(ValueError, match="agente distinto"):
        await provider.propose("quality", {"route_status": "coordination_active"})
