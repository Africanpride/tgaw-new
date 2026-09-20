import { Ban, Mail, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { email as supportEmail } from "@/config/site"
import { sectionLabelClass } from "@/components/eyebrow"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "@/i18n/config"
import { getServerTranslation } from "@/lib/notifications/locale"
import { auth } from "@/lib/auth"

export default async function BannedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const sp = await searchParams
  const session = await auth.api.getSession({ headers: await headers() })

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  const t = (key: string) => getServerTranslation(locale, "errors", key)

  const [tTitle, tReason, tExpires, tSupport, tHome, tDefaultReason] = await Promise.all([
    t("banned.title"),
    t("banned.reason"),
    t("banned.expires"),
    t("banned.support"),
    t("banned.home"),
    t("banned.defaultReason"),
  ])

  const user = session?.user as
    | {
        name?: string
        email?: string
        banReason?: string | null
        banExpires?: Date | string | null
      }
    | undefined

  const banReason =
    sp.reason ??
    user?.banReason ??
    tDefaultReason

  let banExpiresText: string | null = null
  if (user?.banExpires) {
    const expires = new Date(user.banExpires)
    if (!Number.isNaN(expires.getTime())) {
      banExpiresText = expires.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md overflow-hidden text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 bg-destructive/10 py-8">
          <Ban className="size-12 text-destructive" aria-hidden="true" />
        </div>
        <CardHeader className="pt-8">
          <CardTitle className="text-2xl">
            {tTitle}
          </CardTitle>
          <CardDescription className="mx-auto max-w-sm text-balance">
            Hi {user?.name?.split(" ")[0] ?? "there"}, your access to TGAW has
            been suspended.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-left">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className="size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span className={sectionLabelClass}>
                {tReason}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-foreground">{banReason}</p>
            {banExpiresText && (
              <p className="mt-3 text-xs text-muted-foreground">
                {tExpires}{" "}
                <span className="font-medium text-foreground">
                  {banExpiresText}
                </span>
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pb-8">
          <Button variant="outline" className="w-full gap-2" asChild>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                "Account suspension appeal"
              )}&body=${encodeURIComponent(
                `Hi TGAW support team,\n\nMy account has been suspended and I believe this is a mistake.\n\nAccount email: ${user?.email ?? ""}\nReason given: ${banReason}\n\nPlease review my account. Thank you.`
              )}`}
            >
              <Mail className="size-4" aria-hidden="true" />
              {tSupport}
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            <Link
              href="/"
              className="cursor-pointer text-primary hover:underline"
            >
              {tHome}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}