import os
import json
import urllib.request

api_key = os.environ.get("NVIDIA_API_KEY") or os.environ.get("NVIDIA_NIM_API_KEY")
if not api_key:
    for f in [".env", ".env.local", "web/.env.local"]:
        if os.path.exists(f):
            with open(f, "r", encoding="utf-8") as fp:
                for line in fp:
                    if "NVIDIA_API_KEY" in line and not line.strip().startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            api_key = parts[1].strip().strip('"').strip("'")
                            break

print("Has api_key:", bool(api_key))
if api_key:
    payload = json.dumps({
        "model": "nvidia/nemotron-3.5-lightning-30b-a3b",
        "messages": [
            {"role": "user", "content": "Evaluate candidate: Python engineer with 5 years experience. Output SCORE: 85 and DECISION: SHORTLIST"}
        ],
        "max_tokens": 500,
        "temperature": 0.2,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            d = json.loads(resp.read().decode())
            choice = d["choices"][0]["message"]
            print("content:", repr(choice.get("content")))
            print("reasoning_content:", repr((choice.get("reasoning_content") or "")[:300]))
    except Exception as e:
        print("Error:", e)
