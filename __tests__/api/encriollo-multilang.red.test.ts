import { POST } from "@/app/api/encriollo/route"
import { generateWithGroqModelFallback } from "@/lib/server/groq-fallback"

jest.mock("@/lib/server/groq-fallback", () => ({
  generateWithGroqModelFallback: jest.fn(),
}))

const mockedGenerateWithGroqModelFallback = jest.mocked(generateWithGroqModelFallback)

describe("RED - API multilenguaje según idioma del input", () => {
  beforeEach(() => {
    ;(
      globalThis as { Response?: { json: (body: unknown, init?: { status?: number }) => unknown } }
    ).Response = {
      json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
    }

    mockedGenerateWithGroqModelFallback.mockReset()
    mockedGenerateWithGroqModelFallback.mockResolvedValue({
      text: JSON.stringify({
        summary: "ok",
        keyPoints: [],
        actions: [],
        alert: null,
        glossary: [],
      }),
      modelUsed: "mock-model",
    })
  })

  it("si el input está en inglés, debería pedir salida bilingüe (español + idioma original)", async () => {
    const req = {
      json: async () => ({
        mode: "understand",
        text: "Hello, your account is under review and you must respond within 24 hours.",
        sender: "sender.bank",
        simplicity: "simple",
        locale: "es",
      }),
    } as Request

    await POST(req)

    const call = mockedGenerateWithGroqModelFallback.mock.calls[0]
    expect(call?.[1]).toMatch(/español.*idioma original/i)
  })

  it("si el input está en español, debería pedir respuesta al menos en español sin duplicar", async () => {
    const req = {
      json: async () => ({
        mode: "understand",
        text: "Hola, te escribo para avisarte que la reunión se pasa al jueves.",
        sender: "sender.work",
        simplicity: "simple",
        locale: "es",
      }),
    } as Request

    await POST(req)

    const call = mockedGenerateWithGroqModelFallback.mock.calls[0]
    expect(call?.[1]).toMatch(/solo en español|únicamente en español/i)
    expect(call?.[1]).toMatch(/sin duplic/i)
  })

  it("debería forzar estructura clara para usuario final y evitar códigos de idioma crudos o mezclas confusas", async () => {
    const req = {
      json: async () => ({
        mode: "reply",
        text: "Привет, necesito confirmar si esto работает y si debo pagar hoy.",
        sender: "sender.other",
        senderOther: "proveedor",
        tone: "friendly",
        format: "whatsapp",
        locale: "es",
      }),
    } as Request

    await POST(req)

    const call = mockedGenerateWithGroqModelFallback.mock.calls[0]
    expect(call?.[1]).toMatch(/estructura clara|bloques|etiquetas claras/i)
    expect(call?.[1]).toMatch(/evitar.*códigos de idioma|sin códigos de idioma/i)
    expect(call?.[1]).toMatch(/sin tecnicismos confusos|texto técnico confuso/i)
  })
})
