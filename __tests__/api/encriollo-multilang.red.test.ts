import { POST } from "@/app/api/encriollo/route"
import { generateText } from "ai"

jest.mock("ai", () => ({
  generateText: jest.fn(),
}))

jest.mock("@ai-sdk/groq", () => ({
  groq: jest.fn(() => "mock-model"),
}))

const mockedGenerateText = jest.mocked(generateText)

describe("RED - API multilenguaje según idioma del input", () => {
  beforeEach(() => {
    ;(globalThis as { Response?: { json: (body: unknown, init?: { status?: number }) => unknown } }).Response =
      {
        json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
      }

    mockedGenerateText.mockReset()
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        summary: "ok",
        keyPoints: [],
        actions: [],
        alert: null,
        glossary: [],
      }),
    } as Awaited<ReturnType<typeof generateText>>)
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

    const call = mockedGenerateText.mock.calls[0]?.[0]
    expect(call.prompt).toMatch(/español.*idioma original/i)
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

    const call = mockedGenerateText.mock.calls[0]?.[0]
    expect(call.prompt).toMatch(/solo en español|únicamente en español/i)
    expect(call.prompt).toMatch(/sin duplic/i)
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

    const call = mockedGenerateText.mock.calls[0]?.[0]
    expect(call.prompt).toMatch(/estructura clara|bloques|etiquetas claras/i)
    expect(call.prompt).toMatch(/evitar.*códigos de idioma|sin códigos de idioma/i)
    expect(call.prompt).toMatch(/sin tecnicismos confusos|texto técnico confuso/i)
  })
})
