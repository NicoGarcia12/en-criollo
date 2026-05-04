interface GroqMessage {
  role: "system" | "user"
  content: string
}

interface GroqChatCompletionRequest {
  model: string
  messages: GroqMessage[]
}

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export interface GroqFallbackSuccess {
  text: string
  modelUsed: string
}

interface GroqFallbackErrorTrace {
  model: string
  reason: string
  status?: number
}

export class GroqFallbackExhaustedError extends Error {
  public readonly trace: GroqFallbackErrorTrace[]

  public constructor(message: string, trace: GroqFallbackErrorTrace[]) {
    super(message)
    this.name = "GroqFallbackExhaustedError"
    this.trace = trace
  }
}

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
const REQUEST_TIMEOUT_MS = 12_000

function getEnv(name: string): string {
  return process.env[name]?.trim() ?? ""
}

function getModelChain(rawChain: string): string[] {
  return rawChain
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function isUsefulContent(content: unknown): content is string {
  return typeof content === "string" && content.trim().length > 0
}

function parseCompletionText(payload: unknown): string | null {
  const data = payload as GroqChatCompletionResponse
  const content = data.choices?.[0]?.message?.content
  return isUsefulContent(content) ? content : null
}

async function postChatCompletion(
  baseUrl: string,
  apiKey: string,
  body: GroqChatCompletionRequest,
): Promise<Response> {
  const controller = new AbortController()

  // Cleanup explícito del timeout para evitar timers colgados.
  const timer = setTimeout(() => {
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    return await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function generateWithGroqModelFallback(
  system: string,
  prompt: string,
): Promise<GroqFallbackSuccess> {
  const apiKey = getEnv("GROQ_API_KEY")
  const baseUrl = getEnv("GROQ_BASE_URL") || DEFAULT_BASE_URL
  const modelChain = getModelChain(getEnv("GROQ_MODEL_CHAIN"))

  if (!apiKey) {
    throw new Error("GROQ_API_KEY no está configurada")
  }

  if (modelChain.length === 0) {
    throw new Error("GROQ_MODEL_CHAIN está vacío o inválido")
  }

  const trace: GroqFallbackErrorTrace[] = []

  for (const model of modelChain) {
    try {
      console.info(`[groq-fallback] Intentando modelo: ${model}`)

      const response = await postChatCompletion(baseUrl, apiKey, {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      })

      // Reglas de fallback: solo 200 + contenido útil es éxito.
      if (response.status !== 200) {
        const isRetriable =
          response.status === 429 || response.status >= 500 || response.status === 408

        trace.push({
          model,
          reason: isRetriable ? "retryable_http_error" : "non_success_http",
          status: response.status,
        })

        console.warn(`[groq-fallback] Modelo ${model} respondió HTTP ${response.status}`)
        continue
      }

      const payload = (await response.json()) as unknown
      const text = parseCompletionText(payload)

      if (!text) {
        trace.push({ model, reason: "empty_content", status: response.status })
        console.warn(`[groq-fallback] Modelo ${model} devolvió contenido vacío`)
        continue
      }

      console.info(`[groq-fallback] Éxito con modelo: ${model}`)
      return { text, modelUsed: model }
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : error instanceof Error
            ? error.message.slice(0, 120)
            : "unknown_error"

      trace.push({ model, reason })
      console.warn(`[groq-fallback] Error en modelo ${model}: ${reason}`)
    }
  }

  throw new GroqFallbackExhaustedError("Fallaron todos los modelos de GROQ_MODEL_CHAIN", trace)
}
