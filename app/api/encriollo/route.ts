import { generateText, Output } from "ai"
import * as z from "zod"

export const maxDuration = 30

// Debug: verificar qué variables de entorno están disponibles
console.log("[v0] EnCriolloKey exists:", !!process.env.EnCriolloKey)
console.log("[v0] AI_GATEWAY_API_KEY exists:", !!process.env.AI_GATEWAY_API_KEY)
console.log("[v0] EnCriolloKey first 10 chars:", process.env.EnCriolloKey?.slice(0, 10) || "N/A")

// Si EnCriolloKey está configurada, úsala como AI_GATEWAY_API_KEY
if (process.env.EnCriolloKey && !process.env.AI_GATEWAY_API_KEY) {
  process.env.AI_GATEWAY_API_KEY = process.env.EnCriolloKey
  console.log("[v0] Mapped EnCriolloKey to AI_GATEWAY_API_KEY")
}

console.log("[v0] Final AI_GATEWAY_API_KEY exists:", !!process.env.AI_GATEWAY_API_KEY)

// Modelo fijo: AI Gateway de Vercel. AI_GATEWAY_API_KEY se detecta automáticamente.
const MODEL = process.env.ENCRIOLLO_MODEL ?? "openai/gpt-5-mini"

const MAX_INPUT_CHARS = 8000

// ---------------------------- Schemas ----------------------------

const problematicIntentSchema = z.object({
  detected: z.boolean().describe("True if the message contains manipulation, aggression, or scam signals"),
  type: z
    .enum(["normal", "manipulacion", "agresivo", "estafa"])
    .describe("Category of the problematic intent. Use 'normal' if no issue."),
  explanation: z.string().describe("Short explanation of what was detected, in user's locale. Empty string if normal."),
  suggestion: z
    .string()
    .describe("Concrete suggestion on how to proceed safely, in user's locale. Empty string if normal."),
})

const glossaryItemSchema = z.object({
  term: z.string().describe("Term, jargon, or expression in the original message language"),
  meaning: z.string().describe("Plain explanation in the user's locale"),
})

const understandSchema = z.object({
  summary: z.string().describe("Plain-language explanation in the user's locale (2-4 sentences)"),
  toneAnalysis: z.string().describe("Tone of the original message in user's locale (formal, urgent, friendly, etc.)"),
  keyPoints: z.array(z.string()).describe("Key points (3-6 bullets) in the user's locale"),
  actions: z.array(z.string()).describe("Concrete actions to take, in user's locale. Empty if none."),
  warnings: z.array(z.string()).describe("Risks, deadlines, conditions, ambiguities. Empty if none."),
  glossary: z.array(glossaryItemSchema).describe("Slang/technical terms with meaning. Empty if none."),
  questionsToAsk: z
    .array(z.string())
    .describe("Smart questions the user should ask back to protect themselves. Empty if not relevant."),
  suggestedReply: z
    .string()
    .nullable()
    .describe("Suggested reply in user's locale if a response is needed. Null otherwise."),

  inputLanguage: z.string().describe("ISO-like language code of the original message (e.g. 'es', 'en', 'pt')"),
  needsBilingual: z.boolean().describe("True if input language differs from user locale"),
  alternateSummary: z
    .string()
    .nullable()
    .describe("Same summary translated to the original message language. Null if needsBilingual is false."),
  alternateSuggestedReply: z
    .string()
    .nullable()
    .describe("Suggested reply translated to the original message language. Null if not applicable."),
  alternateLanguageLabel: z
    .string()
    .nullable()
    .describe("Human-readable language name in user's locale (e.g. 'inglés', 'English'). Null if not bilingual."),

  problematicIntent: problematicIntentSchema,
})

const replySchema = z.object({
  interpretation: z.string().describe("Short summary of what the message says, in user's locale"),
  probableIntent: z.string().describe("What the sender probably wants, in user's locale"),

  reply: z.string().describe("The full reply in user's locale, ready to send"),
  draftBullets: z
    .array(z.string())
    .describe("Bullet-point breakdown of what the reply says (3-6 bullets). Same locale as the reply."),
  whyItWorks: z.string().describe("One sentence explaining why this reply works, in user's locale"),

  inputLanguage: z.string().describe("ISO-like language code of the received message"),
  needsBilingual: z.boolean().describe("True if recipient language likely differs from user locale"),
  alternateReply: z
    .string()
    .nullable()
    .describe("Reply translated to the recipient's language. Null if not bilingual."),
  alternateDraftBullets: z
    .array(z.string())
    .nullable()
    .describe("Bullet breakdown in recipient's language. Null if not bilingual."),
  alternateLanguageLabel: z
    .string()
    .nullable()
    .describe("Human-readable language name in user's locale. Null if not bilingual."),

  problematicIntent: problematicIntentSchema,
})

// ---------------------------- Helpers ----------------------------

function localeName(locale: string) {
  if (locale === "en") return "English"
  return "Spanish"
}

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

const SYSTEM_PROMPT = `You are EnCriollo, an assistant that helps people understand difficult texts and reply to messages clearly and humanely.

Hard rules:
- Always answer the visible fields in the user's locale (provided as USER_LOCALE).
- Detect the language of the input message and put the ISO-ish code into "inputLanguage".
- If the input message language is different from USER_LOCALE, set "needsBilingual" to true and ALSO fill the "alternate*" fields with the version in the original message's language. Otherwise set "needsBilingual" to false and set the alternate fields to null.
- Use plain, direct, empathic language. Avoid corporate filler.
- Never invent facts not present in the input.
- Never give definitive legal, medical, or financial advice. Suggest consulting a professional when relevant.
- Detect manipulation, aggression, or scam patterns in the received message and report them via "problematicIntent". When in doubt, use type "normal" with detected=false and empty strings.
- Keep all reply text safe to copy-paste and free of placeholders like "[your name]" UNLESS the user provided a signature, in which case use it.

Style for replies:
- Match the requested tone, length, and format.
- Respect "include" and "avoid" lists strictly.
- For format "WhatsApp" or "SMS": short, no formal headers.
- For format "Formal email": include greeting and sign-off.
- For format "LinkedIn": professional but warm.
- For format "Letter": full formal layout.`

// ---------------------------- Route ----------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const mode = body.mode
    const text = clean(body.text, MAX_INPUT_CHARS + 1)
    const locale = body.locale === "en" ? "en" : "es"

    if (!text || text.length === 0) {
      return Response.json({ error: locale === "en" ? "Text is empty" : "El texto está vacío" }, { status: 400 })
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

Analyze the message and produce the structured output described in the schema.

Message:
"""
${text}
"""

Sender type: ${senderType}
Context: ${context}
Plainness level: ${simplicityLevel}
User's specific question / objective: ${objective || "(not provided — give a general but useful summary)"}

Instructions:
- If the user provided an objective, ORIENT the summary, key points, actions, and warnings to answer that objective first.
- Glossary: include only terms that a general reader would not know (slang, legalese, jargon). Empty array if none.
- questionsToAsk: 2-5 smart questions the user should ask back to the sender to protect themselves or decide better. Empty array if it does not apply.
- toneAnalysis: a short phrase describing the tone of the original message (e.g. "urgent and pressuring", "neutral and informative").
- problematicIntent: flag manipulation, aggression, or scam patterns. Use type "normal" otherwise.
- All visible fields MUST be in ${localeLabel}.
- If inputLanguage !== "${locale}", fill alternateSummary and alternateSuggestedReply (when there is a suggested reply) in the original language; set alternateLanguageLabel to the language name written in ${localeLabel}. Otherwise set those fields to null and needsBilingual=false.`

      const { output } = await generateText({
        model: MODEL,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: understandSchema }),
      })

      return Response.json({ mode: "entender", result: output })
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

Help the user reply to the following message.

Received message:
"""
${text}
"""

Relationship with sender: ${relationship}
User's goal for the reply: ${userGoal || "respond well"}
Desired tone: ${tone}
Desired length: ${length} (short = 1-2 sentences, medium = a short paragraph, detailed = multiple paragraphs)
Desired format: ${format}
Signature to use: ${signature || "(none — close naturally without a signature placeholder)"}
Previous context provided by user: ${previousContext || "(none)"}
Things to include (one per item):
${sayPoints.length ? sayPoints.map((p) => `- ${p}`).join("\n") : "(none)"}
Things to avoid (one per item):
${avoidPoints.length ? avoidPoints.map((p) => `- ${p}`).join("\n") : "(none)"}

Instructions:
- Produce a single "reply" string in ${localeLabel}, matching tone, length and format.
- Provide draftBullets: 3-6 short bullets summarizing what the reply says, in ${localeLabel}, ordered logically.
- Provide whyItWorks: one sentence in ${localeLabel}.
- problematicIntent must analyze the RECEIVED message (not the user's reply).
- If the received message is in a language different from ${locale}, set needsBilingual=true, write the reply also in that language as alternateReply, mirror the bullets in alternateDraftBullets, and set alternateLanguageLabel (in ${localeLabel}). Otherwise set the alternate fields to null and needsBilingual=false.
- Never include "[your name]" or other placeholders. If signature is provided, use it; if not, close naturally without a placeholder.`

      const { output } = await generateText({
        model: MODEL,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: replySchema }),
      })

      return Response.json({ mode: "responder", result: output })
    }

    return Response.json({ error: locale === "en" ? "Invalid mode" : "Modo no válido" }, { status: 400 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorName = err instanceof Error ? err.name : "Unknown"
    console.error("[v0] EnCriollo API error:", errorName, errorMessage)
    console.error("[v0] Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2))
    return Response.json({ 
      error: "Algo salió mal procesando tu pedido",
      debug: { name: errorName, message: errorMessage }
    }, { status: 500 })
  }
}
