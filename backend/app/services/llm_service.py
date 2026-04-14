import os

from app.services.providers.base import LLMProvider
from app.services.providers.claude import ClaudeProvider
from app.services.providers.gemini import GeminiProvider, _build_langchain_messages
from app.services.providers.mock import MockProvider


__all__ = ["get_provider", "stream_chat_response", "_build_langchain_messages"]


def get_provider() -> LLMProvider:
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower()
    if provider == "gemini":
        return GeminiProvider()
    if provider == "claude":
        return ClaudeProvider()
    return MockProvider()
    

async def stream_chat_response(messages, system_prompt: str):
    async for chunk in get_provider().stream(messages, system_prompt):
        yield chunk
