// THIS IS THE ROOT LAYOUT (LANDING + AUTH)
// THE DASHBOARD LAYOUT IS IN app/(dashboard)/layout.tsx

import type { Metadata } from "next"
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "The Global Altar Watch",
  description: "8 Gates of Society — Isaiah 19 Highway",
  icons: {
    icon: "/images/logo.png",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
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
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
