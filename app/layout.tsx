// THIS IS THE ROOT LAYOUT (LANDING + AUTH)
// THE DASHBOARD LAYOUT IS IN app/(dashboard)/layout.tsx

import type { Metadata } from "next"
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google"
import { cookies, headers } from "next/headers"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ConsentProvider } from "@/components/consent/ConsentProvider"
import { CookieConsent } from "@/components/consent"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "@/i18n/config"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "The Global Altar Watch",
  description: "8 Gates of Society — Isaiah 19 Highway",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo.png",
  },
  openGraph: {
    title: "The Global Altar Watch",
    description:
      "Your Daily Faith Companion — devotion, prayer, and fellowship worldwide.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Global Altar Watch",
    description:
      "Your Daily Faith Companion — devotion, prayer, and fellowship worldwide.",
  },
}

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // geo-adaptive: read edge country header for initial region bucket
  let initialCountry: string | null = null
  try {
    const h = await headers()
    initialCountry =
      h.get("x-vercel-ip-country") ??
      h.get("cf-ipcountry") ??
      h.get("CF-IPCountry") ??
      h.get("x-country") ??
      null
    if (initialCountry) initialCountry = initialCountry.toUpperCase()
  } catch {
    // ignore — client fallback will handle
  }

  // locale-aware <html lang>: dashboard + public pages share this root
  // layout ([locale]/layout.tsx only provides translations, no <html>).
  let lang = DEFAULT_LOCALE
  try {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value
    if (isLocale(cookieLocale)) lang = cookieLocale
  } catch {
    // ignore — default locale stands
  }

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        geistSans.variable,
        bebasNeue.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body>
        <template
          dangerouslySetInnerHTML={{
            __html: `<script>(function(){try{var t=localStorage.getItem("theme")||"system";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();(function(){if(typeof window!=="undefined"&&window.performance&&typeof window.performance.measure==="function"){var orig=window.performance.measure.bind(window.performance);window.performance.measure=function(name,s,e){try{return orig(name,s,e);}catch(err){if(err&&(err.message||"").indexOf("negative")!==-1){return;}throw err;}};}})();</script>`,
          }}
        />
        <ThemeProvider>
          <ConsentProvider initialCountry={initialCountry}>
            <TooltipProvider>{children}</TooltipProvider>
            <CookieConsent />
            <Toaster />
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}