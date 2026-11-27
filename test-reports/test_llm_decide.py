import os
from ml_engine.adapters.llm_adapter import LLMAdapter

api_key = None
for f in [".env", ".env.local", "web/.env.local"]:
    if os.path.exists(f):
        with open(f, "r", encoding="utf-8") as fp:
            for line in fp:
                if "NVIDIA_API_KEY" in line and not line.strip().startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        api_key = parts[1].strip().strip('"').strip("'")
                        break

adapter = LLMAdapter(api_key=api_key)
profile = {
    "full_name": "Thouseef F",
    "gender": "Male",
    "years_exp": 1,
    "college_tier": "Tier 2",
    "resume_text": "BCA student graduating 2027. Built fraud detection engine with XGBoost. Published Springer Nature paper. Skills: Python, XGBoost, PyTorch, FastAPI.",
}

try:
    res = adapter.decide(profile, domain="hiring")
    print("SUCCESS!")
    print("Score:", res.get("score"))
    print("Decision:", res.get("decision"))
    print("Rationale:", repr(res.get("rationale")))
    print("Why positive:", res.get("why_positive"))
    print("Raw output:", repr(res.get("raw_output")[:200]))
except Exception as e:
    import traceback
    traceback.print_exc()
