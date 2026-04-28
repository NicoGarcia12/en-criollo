/**
 * Anonymous client-side error logger.
 * Sends a small payload (mode, input length, error label, locale, timestamp)
 * to /api/errors. Never sends user-typed content.
 */
export function logEncriolloError(payload: {
  mode: "entender" | "responder"
  inputLength: number
  errorLabel: string
  locale: string
  status?: number
}) {
  try {
    const body = JSON.stringify({
      ...payload,
      ts: Date.now(),
    })
    // Use sendBeacon when available (survives page navigation), fallback to fetch
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" })
      navigator.sendBeacon("/api/errors", blob)
      return
    }
    void fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // swallow — never throw from logger
    })
  } catch {
    // never throw
  }
}
