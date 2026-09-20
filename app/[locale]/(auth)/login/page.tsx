"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
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

type LoginForm = {
  email: string
  password: string
}

export default function LoginPage() {
  const t = useTranslations("auth")
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
    resolver: zodResolver(
      z.object({
        email: z.string().email(t("validation.invalidEmail")),
        password: z.string().min(1, t("validation.passwordRequired")),
      })
    ),
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
      setError(result.error.message || t("login.invalidCredentials"))
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
      setError(result.error.message || t("login.resendFailed"))
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
        {t("login.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link
          href="/signup"
          className="cursor-pointer font-medium text-primary hover:text-primary/80"
        >
          {t("login.signUpFree")}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {needsVerification && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-medium text-foreground">
              {t("login.verifyEmailTitle")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t("login.verifyEmailBody", { email })}
            </p>
            {resent && (
              <p className="mt-2 text-sm font-medium text-primary">
                {t("login.verificationResent")}
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
                ? t("login.resending")
                : resent
                  ? t("login.sendAgain")
                  : t("login.resendEmail")}
            </Button>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            {t("login.email")}<span className="text-muted-foreground/60">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("login.emailPlaceholder")}
            required
            className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            {...register("email")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            {t("login.password")}<span className="text-muted-foreground/60">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("login.passwordPlaceholder")}
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
              {t("login.remember")}
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? t("login.submitBusy") : t("login.submitLogin")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("login.orContinueWith")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={handleGoogle}
          className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
        >
          <GoogleIcon />
          {t("login.google")}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={handleMicrosoft}
          className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
        >
          <MicrosoftIcon />
          {t("login.microsoft")}
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