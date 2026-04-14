import os
from typing import AsyncIterator, List

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.models.schemas import Message


def _build_langchain_messages(messages: List[Message], system_prompt: str) -> list:
    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
    return lc_messages


class GeminiProvider:
    async def stream(
        self,
        messages: List[Message],
        system_prompt: str,
    ) -> AsyncIterator[str]:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.environ["GOOGLE_API_KEY"],
            streaming=True,
            temperature=0.7,
            max_output_tokens=2048,
        )
        lc_messages = _build_langchain_messages(messages, system_prompt)
        async for chunk in llm.astream(lc_messages):
            if chunk.content:
                yield chunk.content
