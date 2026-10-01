import asyncio
from app.api import research
from app.api.research import AssistantRequest


def test_local_assistant_fallback_responds_to_distinct_questions(monkeypatch):
    async def no_model(_messages):
        return None

    monkeypatch.setattr(research, "complete", no_model)

    async def ask(message):
        return await research.assistant(AssistantRequest(
            message=message,
            assignment={"title": "Chemistry report", "sourceTarget": 4, "draft": "<p>Two paragraphs.</p>", "requirements": [{"text": "Use four sources", "status": "not_checked"}]}
        ))

    source_reply = asyncio.run(ask("How do I strengthen my citations?"))
    length_reply = asyncio.run(ask("Is my word count too short?"))
    concept_reply = asyncio.run(ask("Explain Faraday's first law to me"))

    assert source_reply["provider"] == "local"
    assert "4 sources" in source_reply["reply"]
    assert "words" in length_reply["reply"]
    assert "Faraday" in concept_reply["reply"]
    assert len({source_reply["reply"], length_reply["reply"], concept_reply["reply"]}) == 3
