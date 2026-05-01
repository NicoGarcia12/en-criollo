import fetch from "node-fetch"

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.openai.com/v1/chat/completions"

if (!API_KEY) {
  console.error("[v0] ERROR: OPENAI_API_KEY no está definida")
  process.exit(1)
}

console.log("[v0] OPENAI_API_KEY detectada:", API_KEY.slice(0, 10) + "...")

const testPayload = {
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: "Test message in Dominican Spanish: 'Eh nene, que tu ta haciendo ahora?'",
    },
  ],
  temperature: 0.7,
  max_tokens: 100,
}

console.log("[v0] Enviando request a OpenAI...")
console.log("[v0] Payload:", JSON.stringify(testPayload, null, 2))

fetch(BASE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
  body: JSON.stringify(testPayload),
})
  .then((res) => {
    console.log("[v0] Response status:", res.status)
    return res.json()
  })
  .then((data) => {
    if (data.error) {
      console.error("[v0] OpenAI Error:", data.error)
    } else {
      console.log("[v0] SUCCESS! Respuesta de OpenAI:")
      console.log(data.choices[0].message.content)
    }
  })
  .catch((err) => {
    console.error("[v0] Error:", err.message)
  })
