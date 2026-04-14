from app.models.schemas import Message, ChatRequest


def test_message_user_role():
    msg = Message(role="user", content="hello")
    assert msg.role == "user"
    assert msg.content == "hello"


def test_message_assistant_role():
    msg = Message(role="assistant", content="hi there")
    assert msg.role == "assistant"


def test_chat_request_default_system_prompt():
    req = ChatRequest(messages=[Message(role="user", content="test")])
    assert req.system_prompt == "You are a helpful, concise, and friendly AI assistant."


def test_chat_request_custom_system_prompt():
    req = ChatRequest(
        messages=[Message(role="user", content="test")],
        system_prompt="Custom prompt.",
    )
    assert req.system_prompt == "Custom prompt."


def test_chat_request_multiple_messages():
    req = ChatRequest(
        messages=[
            Message(role="user", content="hello"),
            Message(role="assistant", content="hi"),
            Message(role="user", content="how are you"),
        ]
    )
    assert len(req.messages) == 3
