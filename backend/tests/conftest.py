import pytest


@pytest.fixture
def sample_messages():
    from app.models.schemas import Message
    return [
        Message(role="user", content="Hello"),
    ]
