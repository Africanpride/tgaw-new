// components/login-card.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
// no lucide-react icon needed — GitHub uses inline SVG

function GoogleIcon() {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg viewBox="0 0 24 24" className="h-4 w-4">
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

export function LoginCard() {
  const [remember, setRemember] = useState(true)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/lounge-bg.jpg')" }}
        aria-hidden="true"
      />
      {/* Overlay — stronger on the left/mobile so the card stays readable */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 sm:from-black/80 sm:via-black/40 sm:to-black/10"
        aria-hidden="true"
      />

      {/* Card wrapper: full-width + padded on mobile, left-anchored on desktop */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 lg:justify-start lg:p-0 lg:pl-20">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0f17]/95 p-6 shadow-2xl backdrop-blur-sm sm:p-6">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
              s
            </span>
            <span className="text-lg font-semibold text-white">
              shadcnspace.
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl text-white sm:text-3xl">
            Login to Shadcnspace
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign up for free
            </a>
          </p>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-300">
                Email<span className="text-gray-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="example@shadcnspace.com"
                required
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-300">
                Password<span className="text-gray-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:ring-white/30"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v: boolean) => setRemember(v === true)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal text-gray-300"
                >
                  Remember this device
                </Label>
              </div>
              <a
                href="/forgot-password"
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-md bg-white text-black hover:bg-gray-200"
            >
              Log in
            </Button>
          </form>

          {/* Divider */}
          <p className="mt-6 text-center text-sm text-gray-500">
            or sign in with
          </p>

          {/* OAuth buttons */}
          <div className="mt-4 space-y-3">
            <Button
              variant="outline"
              type="button"
              className="h-11 w-full justify-center gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-11 w-full justify-center gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
              </svg>
              Sign in with Github
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
