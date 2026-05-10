import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Navigation } from "@/components/layout/Navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { Toaster } from "sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "Finan — AI Трекер Финансов",
  description: "Персональный AI-трекер финансов. Добавляй транзакции за 5 секунд.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="h-full antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <div className="flex h-full min-h-screen">
            <Navigation />
            <main className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
              {children}
            </main>
          </div>
          <BottomNav />
          <Toaster
            position="top-right"
            toastOptions={{ style: { fontFamily: "var(--font-geist-sans)" } }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
