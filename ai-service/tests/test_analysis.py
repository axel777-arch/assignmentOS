from app.schemas.analysis import AssignmentContext
from app.schemas.requirements import Requirement
from app.services.assignment_analyzer import analyze_assignment


def test_analysis_counts_words_and_detects_heading_and_sources():
    assignment = AssignmentContext(
        title="Report", minWords=1, maxWords=100,
        requirements=[Requirement(id="section", text="Include a conclusion section", kind="section"), Requirement(id="sources", text="Use at least 1 source", kind="sources")]
    )
    result = analyze_assignment(assignment, "<h2>Conclusion</h2><p>Claim with support.</p><h3>References</h3><p>Author, A. A source entry.</p>")
    assert result.score == 100
    assert all(item.status == "met" for item in result.items)


def test_analysis_marks_short_draft_partial():
    assignment = AssignmentContext(minWords=50, maxWords=100, requirements=[Requirement(id="len", text="Write 50 to 100 words", kind="length")])
    result = analyze_assignment(assignment, "<p>Short draft.</p>")
    assert result.items[0].status == "partial"
