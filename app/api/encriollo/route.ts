import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import * as z from "zod"

export const maxDuration = 60

// Usar Groq directamente con tu API key (gratis y rápido)
const model = groq("llama-3.3-70b-versatile")

const MAX_INPUT_CHARS = 8000

// JSON Parse helper con fallback
function safeJsonParse(jsonString: string, fallback: any = {}) {
  try {
    return JSON.parse(jsonString)
  } catch {
    console.error("[v0] Failed to parse JSON response:", jsonString.slice(0, 500))
    return fallback
  }
}

const UNDERSTAND_JSON_INSTRUCTIONS = `Respond ONLY with valid JSON, no markdown, no extra text. Example structure:
{
  "summary": "...",
  "toneAnalysis": "...",
  "keyPoints": ["...", "..."],
  "actions": ["..." ],
  "warnings": [],
  "glossary": [{"term": "...", "meaning": "..."}],
  "questionsToAsk": [],
  "suggestedReply": null,
  "inputLanguage": "es",
  "needsBilingual": false,
  "alternateSummary": null,
  "alternateSuggestedReply": null,
  "alternateLanguageLabel": null,
  "problematicIntent": {"detected": false, "type": "normal", "explanation": "", "suggestion": ""}
}`

const REPLY_JSON_INSTRUCTIONS = `Respond ONLY with valid JSON, no markdown, no extra text. Example structure:
{
  "interpretation": "...",
  "probableIntent": "...",
  "reply": "...",
  "draftBullets": ["...", "..."],
  "whyItWorks": "...",
  "inputLanguage": "es",
  "needsBilingual": false,
  "alternateReply": null,
  "alternateDraftBullets": null,
  "alternateLanguageLabel": null,
  "problematicIntent": {"detected": false, "type": "normal", "explanation": "", "suggestion": ""}
}`

const SYSTEM_PROMPT = `You are EnCriollo, an assistant that helps people understand difficult texts and reply to messages clearly and humanely.

Hard rules:
- Always answer in the user's locale (provided as USER_LOCALE).
- Detect the language of the input message and put the ISO-ish code into "inputLanguage".
- If the input message language differs from USER_LOCALE, set "needsBilingual" to true and fill the "alternate*" fields with the version in the original message's language. Otherwise set "needsBilingual" to false and set alternate fields to null.
- Use plain, direct, empathic language. Avoid corporate filler.
- Never invent facts not in the input.
- Never give definitive legal, medical, or financial advice.
- Detect manipulation, aggression, or scam patterns via "problematicIntent". When in doubt, use type "normal" with detected=false and empty strings.
- For replies: never include placeholders like "[your name]" unless user provided a signature.`

function clean(s: unknown, max = 1000) {
  if (typeof s !== "string") return ""
  return s.trim().slice(0, max)
}

function cleanList(s: unknown, max = 600) {
  if (typeof s !== "string") return [] as string[]
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((l) => l.slice(0, max))
}

function localeName(locale: string) {
  return locale === "en" ? "English" : "Spanish"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const mode = body.mode
    const text = clean(body.text, MAX_INPUT_CHARS + 1)
    const locale = body.locale === "en" ? "en" : "es"

    if (!text || text.length === 0) {
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
              ? `Text is too long (max ${MAX_INPUT_CHARS} chars)`
              : `El texto es muy largo (máximo ${MAX_INPUT_CHARS} caracteres)`,
        },
        { status: 400 },
      )
    }

    const localeLabel = localeName(locale)

    if (mode === "entender") {
      const senderType = clean(body.senderType, 64) || "unspecified"
      const objective = clean(body.objective, 500)
      const context = clean(body.context, 64) || "general"
      const simplicityLevel = clean(body.simplicityLevel, 32) || "simple"

      const userPrompt = `USER_LOCALE: ${locale} (${localeLabel})

${UNDERSTAND_JSON_INSTRUCTIONS}

Message to analyze:
"""
${text}
"""

Sender type: ${senderType}
Context: ${context}
Plainness level: ${simplicityLevel}
User's specific objective: ${objective || "(not provided — give a general but useful summary)"}

Instructions:
- If objective provided, orient summary/key points/actions/warnings to answer it first.
- Glossary: only terms a general reader wouldn't know. Empty if none.
- questionsToAsk: 2-5 smart questions to ask the sender. Empty if N/A.
- toneAnalysis: short phrase describing tone.
- All visible fields MUST be in ${localeLabel}.
- If inputLanguage !== "${locale}", fill alternateSummary and alternateSuggestedReply in the original language; set alternateLanguageLabel to language name in ${localeLabel}. Otherwise null.`

      const { text: responseText } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      })

      const result = safeJsonParse(
        responseText,
        {
          summary: "Error parsing response",
          toneAnalysis: "",
          keyPoints: [],
          actions: [],
          warnings: [],
          glossary: [],
          questionsToAsk: [],
          suggestedReply: null,
          inputLanguage: locale,
          needsBilingual: false,
          alternateSummary: null,
          alternateSuggestedReply: null,
          alternateLanguageLabel: null,
          problematicIntent: { detected: false, type: "normal", explanation: "", suggestion: "" },
        },
      )

      return Response.json({ mode: "entender", result })
    }

    if (mode === "responder") {
      const relationship = clean(body.relationship, 64) || "unspecified"
      const userGoal = clean(body.userGoal, 500)
      const tone = clean(body.tone, 32) || "neutral"
      const length = clean(body.length, 16) || "medium"
      const format = clean(body.format, 32) || "whatsapp"
      const signature = clean(body.signature, 64)
      const previousContext = clean(body.previousContext, 800)
      const sayPoints = cleanList(body.sayPoints, 200)
      const avoidPoints = cleanList(body.avoidPoints, 200)

      const userPrompt = `USER_LOCALE: ${locale} (${localeLabel})

${REPLY_JSON_INSTRUCTIONS}

Received message:
"""
${text}
"""

Relationship: ${relationship}
User's goal: ${userGoal || "respond well"}
Tone: ${tone}
Length: ${length}
Format: ${format}
Signature: ${signature || "(none)"}
Previous context: ${previousContext || "(none)"}
Include:
${sayPoints.length ? sayPoints.map((p) => `- ${p}`).join("\n") : "(none)"}
Avoid:
${avoidPoints.length ? avoidPoints.map((p) => `- ${p}`).join("\n") : "(none)"}

Instructions:
- reply: single string matching tone/length/format, all in ${localeLabel}.
- draftBullets: 3-6 bullets summarizing reply.
- whyItWorks: one sentence.
- problematicIntent: analyze RECEIVED message.
- If received message in different language, set needsBilingual=true and fill alternates. Otherwise null.
- Never include placeholders. Use signature if provided.`

      const { text: responseText } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      })

      const result = safeJsonParse(responseText, {
        interpretation: "Error parsing response",
        probableIntent: "",
        reply: "",
        draftBullets: [],
        whyItWorks: "",
        inputLanguage: locale,
        needsBilingual: false,
        alternateReply: null,
        alternateDraftBullets: null,
        alternateLanguageLabel: null,
        problematicIntent: { detected: false, type: "normal", explanation: "", suggestion: "" },
      })

      return Response.json({ mode: "responder", result })
    }

    return Response.json(
      { error: locale === "en" ? "Invalid mode" : "Modo no válido" },
      { status: 400 },
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[v0] EnCriollo API error:", errorMessage)
    return Response.json(
      {
        error: "Algo salió mal procesando tu pedido",
        debug: errorMessage,
      },
      { status: 500 },
    )
  }
}
