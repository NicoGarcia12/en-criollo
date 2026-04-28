/**
 * Anonymous error reporting endpoint.
 * Receives {mode, inputLength, errorLabel, locale, status, ts} and writes to server log.
 * Does NOT receive or store user-typed content.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const safe = {
      mode: typeof body.mode === "string" ? body.mode.slice(0, 32) : "unknown",
      inputLength: typeof body.inputLength === "number" ? Math.min(body.inputLength, 100000) : 0,
      errorLabel: typeof body.errorLabel === "string" ? body.errorLabel.slice(0, 200) : "unknown",
      locale: typeof body.locale === "string" ? body.locale.slice(0, 8) : "unknown",
      status: typeof body.status === "number" ? body.status : null,
      ts: typeof body.ts === "number" ? body.ts : Date.now(),
    }
    // Visible in Vercel/server logs; can be aggregated later.
    console.log("[encriollo:error]", JSON.stringify(safe))
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 204 })
  }
}
