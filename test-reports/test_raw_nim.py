import os
import json
import urllib.request

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

payload = json.dumps({
    "model": "nvidia/nemotron-3.5-lightning-30b-a3b",
    "messages": [
        {
            "role": "system",
            "content": "You are an objective hiring evaluator. You must strictly output the requested fields: SCORE, DECISION, WHY_SHOULD_HIRE, WHY_AI_MIGHT_FLAG, and REASONING."
        },
        {
            "role": "user",
            "content": "Evaluate candidate for role: Software Engineer.\nName: Thouseef\nResume Text:\n\"\"\"\nPython, XGBoost\n\"\"\"\n\nRespond strictly adhering to this format:\nSCORE: <integer 0-100>\nDECISION: <SHORTLIST or REJECT>\nWHY_SHOULD_HIRE:\n- <Point 1>\nWHY_AI_MIGHT_FLAG:\n- <Flag 1>\nREASONING: <evaluation>"
        }
    ],
    "max_tokens": 1200,
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
    print("CONTENT:", repr(msg.get("content")))
    print("REASONING_CONTENT LEN:", len(msg.get("reasoning_content") or ""))
    print("REASONING_CONTENT PREVIEW:", repr((msg.get("reasoning_content") or "")[:500]))
    print("REASONING_CONTENT END:", repr((msg.get("reasoning_content") or "")[-500:]))
