import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { UnifiedForm } from "@/components/encriollo/unified-form"
import { logEncriolloError } from "@/components/encriollo/error-logger"

const addToHistoryMock = jest.fn()

jest.mock("@/lib/i18n/locale-context", () => ({
  useLocale: () => ({
    locale: "es",
    setLocale: jest.fn(),
    t: (key: string) => {
      const dict: Record<string, string> = {
        "uf.submit.reply": "Ayudame a responder",
        "uf.submit.understand": "Explicámelo",
        "uf.submit.loading": "Pensando…",
        "common.error.server": "Algo salió mal",
        "common.error.invalidResponse": "Respuesta inválida",
        "common.error.network": "Error de red",
        "common.error.rateLimit": "Demasiadas solicitudes",
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
  UnifiedResult: ({ data }: { data?: { error?: string; output?: string } }) => (
    <div role="status">{data?.error ?? data?.output ?? "ok"}</div>
  ),
}))

jest.mock("@/components/encriollo/error-logger", () => ({
  logEncriolloError: jest.fn(),
}))

jest.mock("@/components/encriollo/history-store", () => ({
  addToHistory: (...args: unknown[]) => addToHistoryMock(...args),
}))

describe("UnifiedForm - submit y errores", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
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

  function clickSubmit() {
    const submitButton = document.querySelector('button[form="unified-form"][type="submit"]')
    if (!submitButton) throw new Error("No se encontró el botón submit")
    fireEvent.click(submitButton)
  }

  it("envía payload y guarda historial cuando el submit es exitoso", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ output: "ok" }),
    } as Response)

    renderReadyToSubmit()
    clickSubmit()

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(addToHistoryMock).toHaveBeenCalledTimes(1))
  })

  it("mapea error de red a copy de network y loguea evento", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed"))

    renderReadyToSubmit()
    clickSubmit()

    await waitFor(() => expect(screen.getByText("Error de red")).toBeInTheDocument())
    expect(logEncriolloError).toHaveBeenCalledTimes(1)
  })

  it("si backend devuelve 429 muestra mensaje de rate limit", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "rate" }),
    } as Response)

    renderReadyToSubmit()
    clickSubmit()

    await waitFor(() => expect(screen.getByText(/demasiadas solicitudes/i)).toBeInTheDocument())
  })
})
