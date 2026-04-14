from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services.llm_service import get_provider

router = APIRouter()


@router.post("/api/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    Streaming SSE endpoint.
    Each event: data: <chunk>\n\n
    Final event: data: [DONE]\n\n
    """
    provider = get_provider()

    async def event_generator():
        async for chunk in provider.stream(
            messages=request.messages,
            system_prompt=request.system_prompt,
        ):
            safe_chunk = chunk.replace("\n", "\\n")
            yield f"data: {safe_chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
