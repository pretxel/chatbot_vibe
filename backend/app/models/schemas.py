from pydantic import BaseModel, model_validator
from typing import List, Optional, Any


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: Optional[str] = (
        "You are a helpful, concise, and friendly AI assistant."
    )

    @model_validator(mode="before")
    @classmethod
    def transform_messages(cls, data: Any):
        if not isinstance(data, dict):
            return data
        raw_messages = data.get("messages", [])
        transformed = []

        for msg in raw_messages:
            if isinstance(msg, dict):
                role = msg.get("role")
                if "content" in msg:
                    content = msg["content"]
                else:
                    parts = msg.get("parts", [])
                    content = "".join(
                        part.get("text", "")
                        for part in parts
                        if part.get("type") == "text"
                    )
            else:
                # Already a Message instance (e.g. passed directly in tests)
                role = msg.role
                content = msg.content

            transformed.append({"role": role, "content": content})

        data["messages"] = transformed
        return data