const DEFAULT_SITE_URL = "http://localhost:3000"

function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) {
    return DEFAULT_SITE_URL
  }

  try {
    const url = new URL(rawUrl)
    url.pathname = ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
