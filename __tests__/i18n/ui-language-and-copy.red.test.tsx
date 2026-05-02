import { render, screen } from "@testing-library/react"
import HomePage from "@/app/page"
import { DICT, LOCALES } from "@/lib/i18n/dictionary"

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img {...props} alt={props.alt ?? ""} />
  ),
}))

jest.mock("@/components/encriollo/encriollo-app", () => ({
  EnCriolloApp: () => <div data-testid="encriollo-app" />,
}))

jest.mock("@/components/encriollo/locale-toggle", () => ({
  LocaleToggle: () => <div data-testid="locale-toggle">ES/EN toggle</div>,
}))

jest.mock("@/lib/i18n/locale-context", () => ({
  useLocale: () => ({
    locale: "es",
    setLocale: jest.fn(),
    t: (key: keyof (typeof DICT)["es"]) => DICT.es[key],
  }),
}))

describe("RED - UI en español y propuesta de valor", () => {
  it("debería usar el copy final definido para el subtitle principal", () => {
    expect(DICT.es["app.subtitle"]).toBe(
      "Recibís un mensaje, lo entendés de verdad y respondés mejor: dos funcionalidades diferenciadas que trabajan juntas para mejorar tu comunicación.",
    )
    expect(DICT.es["app.subtitle"]).not.toMatch(/En Criollo/i)
  })

  it("debería tener solo locale español", () => {
    expect(LOCALES).toEqual(["es"])
    expect(Object.keys(DICT)).toEqual(["es"])
  })

  it("no debería renderizar toggle de idioma en la home", () => {
    render(<HomePage />)
    expect(screen.queryByTestId("locale-toggle")).not.toBeInTheDocument()
  })

  it("no debería mostrar textos en inglés visibles en la UI principal", () => {
    render(<HomePage />)
    expect(screen.queryByText(/ES\/EN toggle/i)).not.toBeInTheDocument()
  })

  it("footer: el texto de marca debería usar verde neón del proyecto", () => {
    render(<HomePage />)

    const footer = screen.getByRole("contentinfo")
    const brandText = footer.querySelector("p:first-child span") as HTMLElement | null

    expect(brandText).not.toBeNull()
    expect(brandText?.getAttribute("style") ?? "").toContain("var(--neon)")
  })

  it("footer: debería incluir autoría profesional de Nicolás García para Zero to Agent", () => {
    expect(DICT.es["footer.made"]).toMatch(/Nicolás García/i)
    expect(DICT.es["footer.made"]).toMatch(/Zero to Agent/i)
    expect(DICT.es["footer.made"]).not.toMatch(/cariño y un poco de IA/i)
  })
})
