from typing import AsyncIterator, List, Protocol

from app.models.schemas import Message


class LLMProvider(Protocol):
    async def stream(
        self,
        messages: List[Message],
        system_prompt: str,
    ) -> AsyncIterator[str]: ...
