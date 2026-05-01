import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { LocaleProvider } from "@/lib/i18n/locale-context"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "EnCriollo",
  description:
    "Pegá un texto difícil y te decimos qué significa, qué importa y qué hacer. O pegá un mensaje incómodo y te ayudamos a responder claro y sin quedar mal.",
  icons: {
    icon: "/gaucho-icon.svg",
    shortcut: "/gaucho-icon.svg",
    apple: "/gaucho-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <LocaleProvider>
          {children}
          <Toaster richColors position="top-center" />
        </LocaleProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
