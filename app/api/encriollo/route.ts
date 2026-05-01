import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export const maxDuration = 60

const model = groq("llama-3.3-70b-versatile")
const MAX_INPUT_CHARS = 8000

function safeJsonParse(jsonString: string, fallback: object = {}) {
  try {
    // Remove markdown code blocks if present
    let cleaned = jsonString.trim()
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }
    return JSON.parse(cleaned)
  } catch {
    console.error("[v0] Failed to parse JSON:", jsonString.slice(0, 300))
    return fallback
  }
}

function clean(s: unknown, max = 1000): string {
  if (typeof s !== "string") return ""
  return s.trim().slice(0, max)
}

function localeName(locale: string) {
  return locale === "en" ? "English" : "Spanish"
}

const SYSTEM_PROMPT = `You are EnCriollo, an assistant that helps people understand difficult texts and craft thoughtful replies.

Rules:
- Answer in the user's locale (USER_LOCALE).
- Use plain, direct, empathic language. No corporate filler.
- Never invent facts not present in the input.
- Never give definitive legal, medical, or financial advice.
- Detect manipulation, aggression, or scam patterns. Alert the user if found.
- Keep output focused and practical. No padding or repetition.`

const UNDERSTAND_JSON = `{
  "summary": "2-3 sentence summary in plain language",
  "keyPoints": ["key point 1", "key point 2"],
  "actions": ["what user should do 1", "action 2"],
  "alert": "warning message if scam/manipulation/risk detected, null otherwise",
  "glossary": [{"term": "technical term", "meaning": "simple explanation"}]
}`

const REPLY_JSON = `{
  "reply": "the full reply text ready to copy",
  "replyReason": "1 sentence explaining why this reply works",
  "alert": "warning if received message is manipulative/aggressive, null otherwise",
  "summary": "1 sentence summary of what the received message is about",
  "glossary": null
}`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, text: rawText, sender, senderOther, locale: rawLocale } = body
    const text = clean(rawText, MAX_INPUT_CHARS + 1)
    const locale = rawLocale === "en" ? "en" : "es"

    if (!text) {
      return Response.json(
        { error: locale === "en" ? "Text is empty" : "El texto está vacío" },
        { status: 400 },
      )
    }
    if (text.length > MAX_INPUT_CHARS) {
      return Response.json(
        {
          error:
            locale === "en"
              ? `Max ${MAX_INPUT_CHARS} chars`
              : `Máximo ${MAX_INPUT_CHARS} caracteres`,
        },
        { status: 400 },
      )
    }

    const localeLabel = localeName(locale)
    const senderLabel =
      sender === "sender.other" ? senderOther : sender?.replace("sender.", "") || "unknown"

    if (mode === "understand") {
      const { simplicity = "simple", objective } = body

      const prompt = `USER_LOCALE: ${locale} (${localeLabel})

Analyze this text and respond ONLY with valid JSON matching this structure:
${UNDERSTAND_JSON}

Text to analyze:
"""
${text}
"""

Sender: ${senderLabel}
Detail level: ${simplicity}
${objective ? `User's question: ${objective}` : ""}

Instructions:
- summary: Plain language, address user's question if provided
- keyPoints: Max 5 items, most important facts
- actions: What the user should do (empty array if nothing required)
- alert: Only if manipulation/scam/risk detected, otherwise null
- glossary: Only truly technical terms, empty array if none
- ALL text must be in ${localeLabel}`

      const { text: responseText } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt,
      })

      const result = safeJsonParse(responseText, {
        summary: locale === "en" ? "Could not process the text" : "No se pudo procesar el texto",
        keyPoints: [],
        actions: [],
        alert: null,
        glossary: [],
      })

      return Response.json({
        summary: result.summary || null,
        keyPoints: result.keyPoints || [],
        actions: result.actions || [],
        alert: result.alert || null,
        glossary: result.glossary || [],
        reply: null,
        replyReason: null,
      })
    }

    if (mode === "reply") {
      const { tone = "friendly", format = "whatsapp", goal, signature, priorContext } = body

      const prompt = `USER_LOCALE: ${locale} (${localeLabel})

Craft a reply and respond ONLY with valid JSON matching this structure:
${REPLY_JSON}

Message received:
"""
${text}
"""

From: ${senderLabel}
Tone: ${tone}
Format: ${format}
${goal ? `User's goal: ${goal}` : ""}
${signature ? `Sign as: ${signature}` : "Do not include a signature"}
${priorContext ? `Prior context: ${priorContext}` : ""}

Instructions:
- reply: Ready to copy. Match tone and format. ${format === "whatsapp" ? "Keep it conversational." : format === "email" ? "Include greeting and closing." : ""}
- replyReason: Brief explanation of approach
- alert: Only if received message shows manipulation/aggression/scam
- summary: What the received message is asking/saying
- ALL text must be in ${localeLabel}`

      const { text: responseText } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt,
      })

      const result = safeJsonParse(responseText, {
        reply: locale === "en" ? "Could not generate reply" : "No se pudo generar la respuesta",
        replyReason: null,
        alert: null,
        summary: null,
      })

      return Response.json({
        summary: result.summary || null,
        keyPoints: null,
        actions: null,
        alert: result.alert || null,
        glossary: null,
        reply: result.reply || null,
        replyReason: result.replyReason || null,
      })
    }

    return Response.json(
      { error: locale === "en" ? "Invalid mode" : "Modo inválido" },
      { status: 400 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[v0] API error:", msg)
    return Response.json({ error: "Algo salió mal al procesar tu pedido" }, { status: 500 })
  }
}
