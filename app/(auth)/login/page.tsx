"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  AuthBrand,
  AuthShell,
  GoogleIcon,
  MicrosoftIcon,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setError(null)
    setNeedsVerification(false)
    setEmail(data.email)
    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })
    if (result.error) {
      // Only genuinely banned users go to /banned; an unverified account
      // returns a 403 with EMAIL_NOT_VERIFIED and must not be treated as a ban.
      const code = (result.error as { code?: string }).code
      if (code === "BANNED_USER") {
        router.push("/banned")
        return
      }
      if (code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true)
        return
      }
      setError(result.error.message || "Invalid credentials")
    } else {
      router.push("/overview")
    }
  }

  async function handleResendVerification() {
    setResending(true)
    setResent(false)
    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/overview",
    })
    setResending(false)
    if (result.error) {
      setError(result.error.message || "Failed to resend verification email")
    } else {
      setResent(true)
    }
  }

  async function handleMicrosoft() {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/overview",
    })
  }

  async function handleGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/overview",
    })
  }

  return (
    <AuthShell>
      <AuthBrand />

      <h1 className="text-2xl text-card-foreground sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="cursor-pointer font-medium text-primary hover:text-primary/80"
        >
          Sign up for free
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {needsVerification && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-medium text-foreground">
              Please verify your email
            </p>
            <p className="mt-1 text-muted-foreground">
              We sent a verification link to {email}. Check your inbox to
              activate your account.
            </p>
            {resent && (
              <p className="mt-2 text-sm font-medium text-primary">
                Verification email sent again. Check your inbox.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resending}
              onClick={handleResendVerification}
              className="mt-3 h-9 w-full cursor-pointer"
            >
              {resending
                ? "Resending..."
                : resent
                  ? "Send again"
                  : "Resend verification email"}
            </Button>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            Email<span className="text-muted-foreground/60">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            {...register("email")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            Password<span className="text-muted-foreground/60">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            {...register("password")}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              className="border-border data-[checked]:bg-primary data-[checked]:text-primary-foreground"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal text-muted-foreground"
            >
              Remember this device
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Signing in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        or continue with
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={handleGoogle}
          className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
        >
          <GoogleIcon />
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={handleMicrosoft}
          className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
        >
          <MicrosoftIcon />
          Microsoft
        </Button>
      </div>

      {/* <p className="mt-6 text-center text-sm text-muted-foreground">
				<Link
					href="/"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					Back to home
				</Link>
			</p> */}
    </AuthShell>
  )
}
