import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { UnifiedForm } from "@/components/encriollo/unified-form"

jest.mock("@/lib/i18n/locale-context", () => ({
  useLocale: () => ({
    locale: "es",
    setLocale: jest.fn(),
    t: (key: string) => {
      const dict: Record<string, string> = {
        "uf.submit.reply": "Ayudame a responder",
        "uf.submit.understand": "Explicámelo",
        "uf.submit.loading": "Pensando…",
        "uf.clear": "Limpiar",
        "common.error.server": "Algo salió mal",
        "common.error.invalidResponse": "Respuesta inválida",
        "common.error.network": "Error de red",
      }

      return dict[key] ?? key
    },
  }),
}))

jest.mock("@/components/encriollo/char-counter", () => ({
  MAX_INPUT_CHARS: 2000,
  CharCounter: () => <span data-testid="char-counter">counter</span>,
}))

jest.mock("@/components/encriollo/unified-result", () => ({
  UnifiedResult: ({ data }: { data?: { error?: string } }) => (
    <div role="status">{data?.error ?? "ok"}</div>
  ),
}))

jest.mock("@/components/encriollo/error-logger", () => ({
  logEncriolloError: jest.fn(),
}))

jest.mock("@/components/encriollo/history-store", () => ({
  addToHistory: jest.fn(),
}))

describe("RED - rate limit frontend (15/h con localStorage)", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ output: "ok" }),
    } as Response)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function renderReadyToSubmit() {
    render(
      <UnifiedForm
        initialValues={{
          mode: "reply",
          text: "Necesito responder este mensaje",
        }}
      />,
    )
  }

  const RATE_LIMIT_STORAGE_KEY = "encriollo:frontend-rate-limit:v1"

  function clickSubmit() {
    const submitButton = document.querySelector('button[form="unified-form"][type="submit"]')
    if (!submitButton) {
      throw new Error("No se encontró el botón submit del formulario")
    }
    fireEvent.click(submitButton)
  }

  function seedAttempts(count: number, nowMs: number) {
    const attempts = Array.from({ length: count }, (_, i) => nowMs - i * 1000)
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts))
  }

  it("1) permite enviar cuando está bajo límite", async () => {
    seedAttempts(14, Date.now())
    renderReadyToSubmit()

    clickSubmit()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it("2) bloquea cuando excede 15 requests por hora", async () => {
    seedAttempts(15, Date.now())
    renderReadyToSubmit()

    clickSubmit()

    expect(global.fetch).toHaveBeenCalledTimes(0)
    await waitFor(() => {
      expect(screen.getByText(/bloquead|límite|demasiad[oa]s solicitudes/i)).toBeInTheDocument()
    })
  })

  it("3) muestra reloj regresivo en estado bloqueado", async () => {
    seedAttempts(15, Date.now())
    renderReadyToSubmit()

    clickSubmit()

    await waitFor(() => {
      expect(screen.getByText(/\b\d{1,2}:\d{2}\b/)).toBeInTheDocument()
    })
  })

  it("4) no muestra contador de requests (ej: 3/15)", () => {
    renderReadyToSubmit()
    expect(screen.queryByText(/\b\d+\s*\/\s*15\b/)).not.toBeInTheDocument()
  })

  it("5) al expirar la ventana permite volver a enviar", async () => {
    jest.useFakeTimers()
    const baseDate = new Date("2026-05-09T10:00:00.000Z")
    jest.setSystemTime(baseDate)
    seedAttempts(15, baseDate.getTime())

    renderReadyToSubmit()
    clickSubmit()
    expect(global.fetch).toHaveBeenCalledTimes(0)

    act(() => {
      jest.setSystemTime(new Date("2026-05-09T11:00:01.000Z"))
      jest.advanceTimersByTime(1000)
    })
    clickSubmit()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
