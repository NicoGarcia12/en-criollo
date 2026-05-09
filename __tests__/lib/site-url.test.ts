describe("siteUrl (canonical/fallback)", () => {
  const originalEnv = process.env

  afterEach(() => {
    jest.resetModules()
    process.env = originalEnv
  })

  it("prioriza NEXT_PUBLIC_SITE_URL y normaliza host sin protocolo", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: "mi-app.com/ar?x=1",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
      VERCEL_URL: "preview.vercel.app",
    }

    const { siteUrl } = await import("@/lib/site-url")
    expect(siteUrl).toBe("https://mi-app.com")
  })

  it("usa fallback productivo cuando no hay NEXT_PUBLIC_SITE_URL", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "https://encriollo.vercel.app/foo",
      VERCEL_URL: "preview.vercel.app",
    }

    const { siteUrl } = await import("@/lib/site-url")
    expect(siteUrl).toBe("https://encriollo.vercel.app")
  })

  it("cae a localhost cuando todas las env son inválidas", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "%%%%",
      VERCEL_URL: "",
    }

    const { siteUrl } = await import("@/lib/site-url")
    expect(siteUrl).toBe("http://localhost:3000")
  })
})
