// components/auth/auth-shell.tsx
"use client"

import type * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.89c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.73-2.46 1.16-4.06 1.16-3.12 0-5.77-2.11-6.71-4.94H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.31A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.58.38-2.31v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.41l4.02-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.59l4.02 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" className="h-4 w-4" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  )
}

function AuthShell({
  children,
  className,
  backgroundImage = "/images/christ_the_redeemer.jpg",
}: {
  children: React.ReactNode
  className?: string
  backgroundImage?: string
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <Link
        href="/"
        className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 text-sm font-bold text-primary shadow-md backdrop-blur-sm transition-colors hover:bg-background"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </Link>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/0 sm:from-foreground/10 sm:via-foreground/5 sm:to-foreground/0"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 lg:justify-start lg:p-0 lg:pl-32">
        <div
          className={cn(
            "w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl backdrop-blur-sm sm:p-6",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function AuthBrand() {
  return (
    <div className="mb-8 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        t
      </span>
      <span className="text-lg font-semibold text-card-foreground">tgaw.</span>
    </div>
  )
}

export { AuthBrand, AuthShell, GoogleIcon, MicrosoftIcon }
