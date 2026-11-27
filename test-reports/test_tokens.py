import os
import json
import urllib.request
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

# Set max_tokens to 2500 in payload
payload = json.dumps({
    "model": "nvidia/nemotron-3.5-lightning-30b-a3b",
    "messages": [
        {
            "role": "system",
            "content": "You are an objective hiring evaluator. You must strictly output the requested fields: SCORE, DECISION, WHY_SHOULD_HIRE, WHY_AI_MIGHT_FLAG, and REASONING."
        },
        {
            "role": "user",
            "content": (
                "Evaluate candidate for role: Software Engineer.\n"
                "Name: Thouseef F\n"
                "Resume Text:\n\"\"\"\n"
                "BCA Dayananda Sagar University (2027). Built fraud detection engine with Redis, XGBoost (PR-AUC 0.9990). "
                "EmailGuard AI (DeBERTa-v3, XGBoost 98.33% accuracy). Agentic RAG assistant (LangGraph, ChromaDB). "
                "IBM SkillsBuild AI/ML Intern (Random Forest, XGBoost).\n\"\"\"\n\n"
                "Respond strictly adhering to this format:\n"
                "SCORE: <integer 0-100>\n"
                "DECISION: <SHORTLIST or REJECT>\n"
                "WHY_SHOULD_HIRE:\n- <Point 1>\n- <Point 2>\n"
                "WHY_AI_MIGHT_FLAG:\n- <Flag 1>\n"
                "REASONING: <evaluation>"
            )
        }
    ],
    "max_tokens": 2500,
    "temperature": 0.2,
}).encode("utf-8")

req = urllib.request.Request(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    data=payload,
    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    method="POST",
)

with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode())
    msg = res["choices"][0]["message"]
    print("FINISH REASON:", res["choices"][0].get("finish_reason"))
    print("CONTENT:\n", msg.get("content"))
    
    adapter = LLMAdapter(api_key=api_key)
    parsed = adapter._parse_structured_output(msg.get("content"), domain="hiring")
    print("\nPARSED SCORE:", parsed.get("score"))
    print("PARSED DECISION:", parsed.get("decision"))
    print("PARSED WHY_HIRE:", parsed.get("why_positive"))
    print("PARSED RATIONALE:", parsed.get("rationale"))
