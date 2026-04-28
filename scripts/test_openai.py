import os
import requests
import json

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("[v0] ERROR: OPENAI_API_KEY no está definida")
    exit(1)

print(f"[v0] OPENAI_API_KEY detectada: {api_key[:10]}...")

url = "https://api.openai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

payload = {
    "model": "gpt-4o-mini",
    "messages": [
        {
            "role": "user",
            "content": "Test: Eh nene, que tu ta haciendo ahora? (Dominican Spanish)"
        }
    ],
    "temperature": 0.7,
    "max_tokens": 100
}

print("[v0] Enviando request a OpenAI...")
print(f"[v0] URL: {url}")
print(f"[v0] Headers: {headers}")

try:
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f"[v0] Response status: {response.status_code}")
    
    data = response.json()
    
    if "error" in data:
        print(f"[v0] ERROR de OpenAI: {data['error']}")
    else:
        print("[v0] SUCCESS! Respuesta:")
        print(data["choices"][0]["message"]["content"])
except Exception as e:
    print(f"[v0] Exception: {str(e)}")
