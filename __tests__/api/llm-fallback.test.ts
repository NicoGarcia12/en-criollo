import {
  generateWithLlmModelFallback,
  LlmFallbackExhaustedError,
} from "@/lib/server/llm-fallback"

describe("llm fallback", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetAllMocks()
    process.env = {
      ...originalEnv,
      LLM_API_KEY: "test-key",
      LLM_BASE_URL: "https://api.groq.com/openai/v1",
      LLM_MODEL_CHAIN: "model-a, model-b",
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("usa el siguiente modelo si el primero responde 429", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(429, { error: "rate limit" }))
      .mockResolvedValueOnce(
        mockFetchResponse(200, {
          choices: [{ message: { content: "respuesta final" } }],
        }),
      )

    global.fetch = fetchMock as typeof fetch

    const result = await generateWithLlmModelFallback("system", "prompt")

    expect(result.modelUsed).toBe("model-b")
    expect(result.text).toBe("respuesta final")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("agota cadena y tira error tipado si todos fallan", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(502, { error: "bad gateway" }))
      .mockResolvedValueOnce(
        mockFetchResponse(200, {
          choices: [{ message: { content: "" } }],
        }),
      )

    global.fetch = fetchMock as typeof fetch

    await expect(generateWithLlmModelFallback("system", "prompt")).rejects.toBeInstanceOf(
      LlmFallbackExhaustedError,
    )
  })

})
function mockFetchResponse(status: number, payload: unknown): Response {
  return {
    status,
    json: async () => payload,
  } as Response
}
