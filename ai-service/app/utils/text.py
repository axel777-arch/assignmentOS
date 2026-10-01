from html.parser import HTMLParser
import re

class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
    def handle_data(self, data: str):
        self.parts.append(data)
    def handle_starttag(self, tag: str, attrs):
        if tag in {"br", "p", "h1", "h2", "h3", "li", "div"}:
            self.parts.append("\n")

def plain_text(value: str) -> str:
    parser = _TextExtractor()
    parser.feed(value or "")
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()

def word_count(value: str) -> int:
    return len(re.findall(r"[\w]+(?:['’-][\w]+)*", value, flags=re.UNICODE))
