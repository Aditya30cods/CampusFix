"""Optional baseline classifier. Replace rules with an evaluated ML model when ready."""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="CampusFix AI helper", version="1.0.0")

class SuggestRequest(BaseModel):
    title: str = ""
    description: str = ""
    location: Optional[str] = ""

RULES = {
    "Network": ("wifi internet network router connectivity offline", "high"),
    "Equipment": ("projector computer screen printer broken device equipment", "medium"),
    "Plumbing": ("water tap leak pipe toilet drain plumbing", "medium"),
    "Electrical": ("power light electricity socket wiring switch", "high"),
    "Facilities": ("chair door window desk room building facility", "low"),
    "Cleaning": ("trash garbage dirty cleaning spill", "low"),
    "Safety": ("danger unsafe hazard emergency injury", "urgent"),
}

@app.get("/health")
def health():
    return {"status": "ok", "service": "CampusFix AI helper"}

@app.post("/suggest")
def suggest(body: SuggestRequest):
    text = f"{body.title} {body.description}".lower()
    scores = {category: sum(1 for word in words.split() if word in text) for category, (words, _) in RULES.items()}
    category = max(scores, key=scores.get) if max(scores.values(), default=0) else "Facilities"
    priority = RULES[category][1]
    if any(word in text for word in ("danger", "smoke", "fire", "exposed wire", "injury")):
        priority = "urgent"
    elif any(word in text for word in ("entire", "everyone", "completely", "down")) and priority == "medium":
        priority = "high"
    return {"category": category, "priority": priority, "confidence": round(scores[category] / max(sum(scores.values()), 1), 2), "method": "keyword baseline"}
