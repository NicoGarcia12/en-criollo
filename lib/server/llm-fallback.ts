import {
  generateWithGroqModelFallback,
  GroqFallbackExhaustedError,
  type GroqFallbackSuccess,
} from "./groq-fallback"

export type LlmFallbackSuccess = GroqFallbackSuccess

export class LlmFallbackExhaustedError extends GroqFallbackExhaustedError {}

export async function generateWithLlmModelFallback(
  system: string,
  prompt: string,
): Promise<LlmFallbackSuccess> {
  try {
    return await generateWithGroqModelFallback(system, prompt)
  } catch (error) {
    if (error instanceof GroqFallbackExhaustedError) {
      throw new LlmFallbackExhaustedError(error.message, error.trace)
    }

    throw error
  }
}
