import re
from html.parser import HTMLParser
from app.schemas.analysis import AnalysisItem, AnalysisResponse, AssignmentContext
from app.schemas.requirements import Requirement
from app.utils.text import plain_text, word_count

IGNORED = {"explain", "describe", "discuss", "analyze", "analyse", "compare", "evaluate", "include", "write", "about", "process", "concept", "two", "three", "four", "five", "one", "the", "and", "with", "from", "that", "this"}

class DraftStructure(HTMLParser):
    def __init__(self):
        super().__init__()
        self.headings: list[str] = []
        self.references: list[str] = []
        self._heading = False
        self._reference_section = False
    def handle_starttag(self, tag: str, attrs):
        self._heading = tag in {"h1", "h2", "h3"}
        if tag == "br": self.references.append("\n")
    def handle_endtag(self, tag: str):
        if tag in {"h1", "h2", "h3"}:
            self._heading = False
    def handle_data(self, data: str):
        clean = data.strip()
        if not clean: return
        if self._heading:
            self.headings.append(clean)
            self._reference_section = clean.casefold().rstrip(":") in {"references", "works cited", "bibliography"}
        elif self._reference_section:
            self.references.append(clean)

def _normalized_keywords(value: str) -> list[str]:
    words = re.findall(r"[\w]{4,}", value.casefold())
    return [word[:-1] if word.endswith("s") and not word.endswith("ss") else word for word in words if word not in IGNORED]

def _source_count(text: str, parser: DraftStructure) -> int:
    citations = len(re.findall(r"\([^()\n]{2,80},?\s?(?:19|20)\d{2}[a-z]?\)|\[[0-9]{1,2}\]", text, re.I))
    entries = sum(1 for part in parser.references if len(part.strip()) > 8)
    return max(citations, entries)

def _check_requirement(requirement: Requirement, assignment: AssignmentContext, text: str, words: int, parser: DraftStructure) -> AnalysisItem:
    status = "missing"
    evidence = "No clear evidence was detected yet. Review this item manually."
    suggestion = f"Make the coverage of '{requirement.text}' explicit and support it with evidence where appropriate."
    if requirement.kind == "length":
        numbers = [int(number.replace(",", "")) for number in re.findall(r"\d[\d,]*", requirement.text)]
        low = numbers[0] if numbers else assignment.targetWords
        high = numbers[1] if len(numbers) > 1 else assignment.maxWords or low
        status = "met" if words >= low and (not high or words <= high) else "partial" if words else "missing"
        evidence = f"Draft contains about {words:,} words; the target is {requirement.text}."
        suggestion = "Expand the least-supported required idea rather than adding filler." if status != "met" else "Length is in range; keep the explanations concise and evidence-led."
    elif requirement.kind == "sources":
        count = _source_count(text, parser)
        target_match = re.search(r"\d+", requirement.text)
        target = int(target_match.group()) if target_match else assignment.sourceTarget or 1
        status = "met" if count >= target else "partial" if count else "missing"
        evidence = f"Detected {count} identifiable citation or reference entries; target is {target}."
        suggestion = "Connect each source to a specific claim and verify its publication details."
    elif requirement.kind == "section":
        heading = re.sub(r"^include a\s+|\s+section$", "", requirement.text, flags=re.I).strip().casefold()
        status = "met" if any(item.casefold() == heading for item in parser.headings) else "missing"
        evidence = "Found headings: " + (", ".join(parser.headings) if parser.headings else "none")
        suggestion = f"Add or label a '{heading}' section if the brief requires one."
    else:
        keywords = _normalized_keywords(requirement.text)
        matches = [keyword for keyword in keywords if keyword in text.casefold()]
        status = "met" if matches else "missing"
        evidence = f"Matched brief terms: {', '.join(matches)}." if matches else "No distinctive brief terms were found in the draft."
        suggestion = f"Develop '{requirement.text}' in your own words and show the supporting reasoning or source."
    return AnalysisItem(requirementId=requirement.id, status=status, evidence=evidence, suggestion=suggestion)

def analyze_assignment(assignment: AssignmentContext, draft: str) -> AnalysisResponse:
    text = plain_text(draft)
    words = word_count(text)
    parser = DraftStructure()
    parser.feed(draft or "")
    items = [_check_requirement(item, assignment, text, words, parser) for item in assignment.requirements]
    points = {"met": 1.0, "partial": 0.5, "missing": 0.0}
    score = round(sum(points.get(item.status, 0) for item in items) / len(items) * 100) if items else 0
    met = sum(item.status == "met" for item in items)
    return AnalysisResponse(score=score, summary=f"{met} of {len(items)} requirements matched by this review.", items=items)
