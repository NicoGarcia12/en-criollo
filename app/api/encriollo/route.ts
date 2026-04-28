import { generateText, Output } from "ai"
import * as z from "zod"

export const maxDuration = 30

const understandSchema = z.object({
  plainExplanation: z.string().describe("Una explicación corta y clara del texto en lenguaje simple"),
  keyPoints: z.array(z.string()).describe("Lista de puntos clave del texto"),
  actions: z.array(z.string()).describe("Acciones concretas que debe hacer el usuario, vacía si no aplica"),
  warnings: z
    .array(z.string())
    .describe("Riesgos, fechas, condiciones, obligaciones o cosas ambiguas; vacía si no hay"),
  suggestedReply: z.string().nullable().describe("Respuesta sugerida si el texto requiere contestar, null si no aplica"),
})

const replySchema = z.object({
  interpretation: z.string().describe("Qué significa el mensaje en pocas palabras"),
  probableIntent: z.string().describe("Qué parece buscar la otra persona"),
  recommendedReply: z.string().describe("Respuesta lista para copiar y pegar"),
  shortReply: z.string().describe("Versión más breve de la respuesta"),
  firmReply: z.string().describe("Versión más directa o profesional, sin ser agresiva"),
  whyItWorks: z.string().describe("Una frase explicando por qué esa respuesta funciona"),
})

const SYSTEM_PROMPT = `Sos EnCriollo, un asistente que ayuda a las personas a entender textos difíciles y responder mensajes de forma clara, útil y humana.

Tu objetivo no es sonar robótico ni adornar demasiado. Tu objetivo es aclarar, simplificar y orientar.

Reglas generales:
- Respondé siempre en el mismo idioma del texto del usuario, salvo que se pida otro idioma.
- Usá lenguaje simple, directo y natural.
- No inventes información que no esté en el texto.
- Si algo no está claro, indicá la incertidumbre.
- No des asesoramiento legal, médico o financiero definitivo. Podés explicar el texto en palabras simples y sugerir consultar a un profesional si hay riesgo.
- No generes respuestas manipuladoras, agresivas, engañosas o que promuevan mentiras.
- Priorizá claridad, empatía y utilidad.
- La respuesta debe ser concreta y fácil de copiar.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, text } = body

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "El texto está vacío" }, { status: 400 })
    }

    if (mode === "entender") {
      const { context = "general", simplicityLevel = "simple" } = body

      const userPrompt = `Analizá el siguiente texto y explicalo de forma clara.

Texto:
"""
${text}
"""

Contexto elegido por el usuario: ${context}
Nivel de simpleza: ${simplicityLevel}

Devolvé la respuesta con esta estructura:
1. plainExplanation: Explicá qué significa el texto en pocas palabras (2-4 oraciones).
2. keyPoints: Listá los puntos clave (3-6 ítems breves).
3. actions: Listá acciones concretas si existen. Si no hay, dejá el array vacío.
4. warnings: Mencioná riesgos, fechas, condiciones, obligaciones o cosas ambiguas. Si no hay, dejá el array vacío.
5. suggestedReply: Si el texto requiere contestar, proponé una respuesta breve y adecuada. Si no requiere respuesta, devolvé null.`

      const { output } = await generateText({
        model: "openai/gpt-5-mini",
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: understandSchema }),
      })

      return Response.json({ mode: "entender", result: output })
    }

    if (mode === "responder") {
      const { relationship = "no especificada", userGoal = "responder bien", tone = "neutral" } = body

      const userPrompt = `Ayudá al usuario a responder el siguiente mensaje.

Mensaje recibido:
"""
${text}
"""

Relación con la persona: ${relationship}
Objetivo del usuario: ${userGoal}
Tono deseado: ${tone}

Devolvé la respuesta con esta estructura:
1. interpretation: Explicá brevemente qué significa el mensaje (1-2 oraciones).
2. probableIntent: Indicá qué parece buscar la otra persona. Si no es seguro, aclaralo.
3. recommendedReply: Escribí una respuesta lista para copiar y pegar, en el tono pedido.
4. shortReply: Una alternativa más breve (1-2 oraciones).
5. firmReply: Una alternativa más directa o profesional, sin ser agresiva.
6. whyItWorks: Una frase explicando por qué esa respuesta funciona.`

      const { output } = await generateText({
        model: "openai/gpt-5-mini",
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: replySchema }),
      })

      return Response.json({ mode: "responder", result: output })
    }

    return Response.json({ error: "Modo no válido" }, { status: 400 })
  } catch (err) {
    console.error("[v0] EnCriollo API error:", err)
    return Response.json({ error: "Algo salió mal procesando tu pedido" }, { status: 500 })
  }
}
