import re

def parse_document(text: str, filename: str) -> dict:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    title = lines[0] if lines else filename.rsplit(".", 1)[0]

    lowered = text.lower()
    category = "General"
    if "invoice" in lowered:
        category = "Invoice"
    elif "resume" in lowered or "cv" in lowered:
        category = "Resume"
    elif "report" in lowered:
        category = "Report"

    summary = " ".join(lines[:3])[:200]

    stopwords = {"the", "and", "this", "that", "with", "from", "they", "have", "been"}
    words = re.findall(r'\b[a-zA-Z]{4,}\b', lowered)
    keywords = list({w for w in words if w not in stopwords})[:10]

    return {
        "title": title,
        "category": category,
        "summary": summary,
        "keywords": keywords
    }