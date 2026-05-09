interface LlmMessage {
  role: "system" | "user"
  content: string
}

interface LlmChatCompletionRequest {
  model: string
  messages: LlmMessage[]
}

interface LlmChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export interface LlmFallbackSuccess {
  text: string
  modelUsed: string
}

interface LlmFallbackErrorTrace {
  model: string
  reason: string
  status?: number
}

export class LlmFallbackExhaustedError extends Error {
  public readonly trace: LlmFallbackErrorTrace[]

  public constructor(message: string, trace: LlmFallbackErrorTrace[]) {
    super(message)
    this.name = "LlmFallbackExhaustedError"
    this.trace = trace
  }
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1"
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
  const data = payload as LlmChatCompletionResponse
  const content = data.choices?.[0]?.message?.content
  return isUsefulContent(content) ? content : null
}

async function postChatCompletion(
  baseUrl: string,
  apiKey: string,
  body: LlmChatCompletionRequest,
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

export async function generateWithLlmModelFallback(
  system: string,
  prompt: string,
): Promise<LlmFallbackSuccess> {
  const apiKey = getEnv("LLM_API_KEY")
  const baseUrl = getEnv("LLM_BASE_URL") || DEFAULT_BASE_URL
  const modelChain = getModelChain(getEnv("LLM_MODEL_CHAIN"))

  if (!apiKey) {
    throw new Error("LLM_API_KEY no está configurada")
  }

  if (modelChain.length === 0) {
    throw new Error("LLM_MODEL_CHAIN está vacío o inválido")
  }

  const trace: LlmFallbackErrorTrace[] = []

  for (const model of modelChain) {
    try {
      console.info(`[llm-fallback] Intentando modelo: ${model}`)

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

        console.warn(`[llm-fallback] Modelo ${model} respondió HTTP ${response.status}`)
        continue
      }

      const payload = (await response.json()) as unknown
      const text = parseCompletionText(payload)

      if (!text) {
        trace.push({ model, reason: "empty_content", status: response.status })
        console.warn(`[llm-fallback] Modelo ${model} devolvió contenido vacío`)
        continue
      }

      console.info(`[llm-fallback] Éxito con modelo: ${model}`)
      return { text, modelUsed: model }
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : error instanceof Error
            ? error.message.slice(0, 120)
            : "unknown_error"

      trace.push({ model, reason })
      console.warn(`[llm-fallback] Error en modelo ${model}: ${reason}`)
    }
  }

  throw new LlmFallbackExhaustedError("Fallaron todos los modelos de LLM_MODEL_CHAIN", trace)
}
