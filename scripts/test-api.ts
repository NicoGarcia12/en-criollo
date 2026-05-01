// Test script para verificar que la API de EnCriollo funciona
// Ejecutar con: npx tsx scripts/test-api.ts

async function testEncriolloAPI() {
  const _baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"

  console.log("[v0] Testing EnCriollo API...")
  console.log("[v0] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY)
  console.log(
    "[v0] OPENAI_API_KEY first 10 chars:",
    process.env.OPENAI_API_KEY?.slice(0, 10) || "N/A",
  )

  // Test simple con modo "entender"
  const testPayload = {
    mode: "entender",
    text: "Hola, necesito que me confirmes la cita de mañana a las 3pm.",
    senderType: "general",
    outputLanguage: "es",
    userGoal: "",
  }

  try {
    console.log("[v0] Sending test request to /api/encriollo...")
    console.log("[v0] Payload:", JSON.stringify(testPayload, null, 2))

    // Test directo usando generateText
    const { generateText, Output } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")
    const { z } = await import("zod")

    console.log("[v0] Imports successful")
    console.log("[v0] Creating OpenAI model...")

    const model = openai("gpt-4o-mini")

    console.log("[v0] Model created, calling generateText...")

    const testSchema = z.object({
      summary: z.string(),
      tone: z.string(),
    })

    const result = await generateText({
      model,
      system: "Eres un asistente que analiza mensajes.",
      prompt:
        "Analiza este mensaje: 'Hola, necesito que me confirmes la cita de mañana a las 3pm.' Responde con un resumen corto y el tono detectado.",
      output: Output.object({ schema: testSchema }),
    })

    console.log("[v0] SUCCESS! Response:", JSON.stringify(result.output, null, 2))
    return true
  } catch (error) {
    console.error("[v0] ERROR:", error)
    if (error instanceof Error) {
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return false
  }
}

testEncriolloAPI()
