from app.services.requirement_extractor import extract_requirements


def test_extracts_range_sources_and_separate_actions():
    items = extract_requirements("Write a 900 to 1,100 word essay. Discuss public access and describe two examples. Use at least 3 sources.")
    assert any(item.kind == "length" and "900" in item.text for item in items)
    assert any(item.kind == "sources" and "3" in item.text for item in items)
    assert len([item for item in items if item.kind == "concept"]) == 2


def test_empty_brief_returns_editable_fallback():
    items = extract_requirements("")
    assert items and items[0].kind == "concept"
