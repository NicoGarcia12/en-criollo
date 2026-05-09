const DEFAULT_SITE_URL = "http://localhost:3000"

function withProtocol(rawHost: string): string {
  // Didáctico: Vercel expone hosts sin protocolo en algunas env vars
  // (ej: "mi-app.vercel.app"). Acá normalizamos a URL válida.
  if (/^https?:\/\//i.test(rawHost)) {
    return rawHost
  }

  return `https://${rawHost}`
}

function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) {
    return DEFAULT_SITE_URL
  }

  try {
    const url = new URL(withProtocol(rawUrl))
    url.pathname = ""
    url.search = ""
    url.hash = ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return DEFAULT_SITE_URL
  }
}

// Fuente única de verdad para URL pública/canónica:
// 1) NEXT_PUBLIC_SITE_URL (manual, recomendada en Vercel)
// 2) VERCEL_PROJECT_PRODUCTION_URL (fallback productivo)
// 3) VERCEL_URL (fallback de entorno actual)
export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL,
)
