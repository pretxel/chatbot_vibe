import os
from typing import AsyncIterator, List

from anthropic import AsyncAnthropic

from app.models.schemas import Message


DEFAULT_MODEL = "claude-sonnet-4-6"


def _to_anthropic_messages(messages: List[Message]) -> list[dict]:
    result = []
    for msg in messages:
        if msg.role in ("user", "assistant"):
            result.append({"role": msg.role, "content": msg.content})
    return result


class ClaudeProvider:
    async def stream(
        self,
        messages: List[Message],
        system_prompt: str,
    ) -> AsyncIterator[str]:
        client = AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        model = os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)

        async with client.messages.stream(
            model=model,
            max_tokens=2048,
            temperature=0.7,
            system=system_prompt,
            messages=_to_anthropic_messages(messages),
        ) as stream:
            async for text in stream.text_stream:
                if text:
                    yield text
