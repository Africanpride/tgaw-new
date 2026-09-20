"use client"

import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation("errors")
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4">{t("error.title", "Something went wrong")}</CardTitle>
          <CardDescription className="text-sm">
            {error.message || t("error.fallback", "An unexpected error occurred. Your session is safe — try again.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => reset()} className="cursor-pointer gap-1.5">
            <RefreshCw className="size-4" />{t("error.retry", "Try again")}
          </Button>
          <Button variant="outline" asChild className="cursor-pointer gap-1.5">
            <Link href="/overview"><Home className="size-4" />{t("error.dashboard", "Dashboard")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}