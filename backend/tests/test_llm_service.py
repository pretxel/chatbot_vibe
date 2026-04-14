from unittest.mock import MagicMock, patch
from app.models.schemas import Message
from app.services.providers.gemini import _build_langchain_messages


def test_build_langchain_messages_includes_system():
    from langchain_core.messages import SystemMessage, HumanMessage
    messages = [Message(role="user", content="hi")]
    result = _build_langchain_messages(messages, "Be concise.")
    assert isinstance(result[0], SystemMessage)
    assert result[0].content == "Be concise."
    assert isinstance(result[1], HumanMessage)
    assert result[1].content == "hi"


def test_build_langchain_messages_assistant_role():
    from langchain_core.messages import AIMessage, HumanMessage
    messages = [
        Message(role="user", content="ping"),
        Message(role="assistant", content="pong"),
    ]
    result = _build_langchain_messages(messages, "sys")
    assert isinstance(result[1], HumanMessage)
    assert isinstance(result[2], AIMessage)


async def test_gemini_provider_yields_chunks():
    from app.services.providers.gemini import GeminiProvider

    async def fake_astream(messages):
        for text in ["Hello", " world"]:
            chunk = MagicMock()
            chunk.content = text
            yield chunk

    mock_llm = MagicMock()
    mock_llm.astream = fake_astream

    with patch("app.services.providers.gemini.ChatGoogleGenerativeAI", return_value=mock_llm):
        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            provider = GeminiProvider()
            chunks = []
            async for chunk in provider.stream(
                [Message(role="user", content="hi")], "Be helpful."
            ):
                chunks.append(chunk)

    assert chunks == ["Hello", " world"]


async def test_gemini_provider_skips_empty_chunks():
    from app.services.providers.gemini import GeminiProvider

    async def fake_astream(messages):
        for text in ["Hello", "", " world"]:
            chunk = MagicMock()
            chunk.content = text
            yield chunk

    mock_llm = MagicMock()
    mock_llm.astream = fake_astream

    with patch("app.services.providers.gemini.ChatGoogleGenerativeAI", return_value=mock_llm):
        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            provider = GeminiProvider()
            chunks = []
            async for chunk in provider.stream(
                [Message(role="user", content="hi")], "Be helpful."
            ):
                chunks.append(chunk)

    assert chunks == ["Hello", " world"]
