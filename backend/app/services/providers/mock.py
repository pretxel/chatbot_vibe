import asyncio
from typing import AsyncIterator, List

from app.models.schemas import Message


class MockProvider:
    async def stream(
        self,
        messages: List[Message],
        system_prompt: str,
    ) -> AsyncIterator[str]:
        last_user_msg = next(
            (m.content for m in reversed(messages) if m.role == "user"),
            "something",
        )
        response_text = (
            f"Hola! Has preguntado: '{last_user_msg}'. "
            "Esta es una respuesta simulada en streaming para demostrar "
            "cómo funciona la integración de FastAPI con Next.js palabra por palabra."
        )
        for word in response_text.split():
            yield word + " "
            await asyncio.sleep(0.2)
