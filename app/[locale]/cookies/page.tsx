import type { Metadata } from "next";
import Link from "next/link"
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { Cookie, ShieldCheck, Globe, Clock, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CookieManageButton } from "@/components/consent/CookieManageButton"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let title = "Cookie Policy — The Global Altar Watch";
  let description =
    "How TGAW uses cookies across regions — GDPR, CCPA, LGPD compliant.";
  try {
    const t = await getTranslations({ locale, namespace: "legal" });
    const translatedTitle = t("meta.cookies.title");
    const translatedDescription = t("meta.cookies.description");
    if (translatedTitle && translatedTitle !== "meta.cookies.title") title = translatedTitle;
    if (translatedDescription && translatedDescription !== "meta.cookies.description")
      description = translatedDescription;
  } catch {
    // English fallback — build never breaks on missing keys
  }
  const suffix = "/cookies";
  const canonical =
    locale === DEFAULT_LOCALE ? suffix : `/${locale}${suffix}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === DEFAULT_LOCALE ? suffix : `/${loc}${suffix}`,
        ]),
      ),
    },
  };
}

export default async function CookiesPage() {
  const t = await getTranslations("legal")
  const email = t("contactEmail")

  const cookieTable = [
    { name: "better-auth.session_token", categoryKey: "cookies.cat.necessary", purposeKey: "cookies.r1.purpose", durationKey: "cookies.r1.duration", providerKey: "cookies.r1.provider" },
    { name: "tgaw_consent", categoryKey: "cookies.cat.necessary", purposeKey: "cookies.r2.purpose", durationKey: "cookies.r2.duration", providerKey: "cookies.r2.provider" },
    { name: "sidebar_state", categoryKey: "cookies.cat.functional", purposeKey: "cookies.r3.purpose", durationKey: "cookies.r3.duration", providerKey: "cookies.r3.provider" },
    { name: "theme", categoryKey: "cookies.cat.functional", purposeKey: "cookies.r4.purpose", durationKey: "cookies.r4.duration", providerKey: "cookies.r4.provider" },
    { name: "_ga, _ga_* (future)", categoryKey: "cookies.cat.analytics", purposeKey: "cookies.r5.purpose", durationKey: "cookies.r5.duration", providerKey: "cookies.r5.provider" },
    { name: "_fbp, fr (future)", categoryKey: "cookies.cat.marketing", purposeKey: "cookies.r6.purpose", durationKey: "cookies.r6.duration", providerKey: "cookies.r6.provider" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex cursor-pointer items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">TGAW</span>
          </Link>
          <Link href="/" className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">{t("backHome")}</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5"><Cookie aria-hidden="true" className="size-3.5" /> {t("cookies.badge")}</Badge>
          <Badge variant="outline" className="gap-1"><Globe aria-hidden="true" className="size-3" /> {t("cookies.region")}</Badge>
          <Badge variant="outline" className="gap-1"><Clock aria-hidden="true" className="size-3" /> {t("cookies.updated")}</Badge>
        </div>

        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">{t("cookies.title")}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {t("cookies.intro")}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <CookieManageButton />
          <Link href="/privacy" className="inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">{t("cookies.privacyBtn")}</Link>
        </div>

        {/* Overview cards */}
        <div className="mt-10 grid gap-2 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck aria-hidden="true" className="size-4 text-emerald-600" /> {t("cookies.gdpr.title")}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{t("cookies.gdpr.bodyA")} <span className="font-medium text-foreground">{t("cookies.gdpr.emphasis")}</span>{t("cookies.gdpr.bodyB")}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Globe aria-hidden="true" className="size-4 text-sky-600" /> {t("cookies.ccpa.title")}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{t("cookies.ccpa.bodyA")} <span className="font-medium text-foreground">{t("cookies.ccpa.emphasis")}</span>{t("cookies.ccpa.bodyB")}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Settings2 aria-hidden="true" className="size-4 text-violet-600" /> {t("cookies.controls.title")}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{t("cookies.controls.bodyA")} <span className="font-medium text-foreground">{t("cookies.controls.mid")}</span> {t("cookies.controls.bodyB")}</p></CardContent>
          </Card>
        </div>

        {/* Categories */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("cookies.categories.title")}</h2>
        <div className="mt-4 grid gap-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("cookies.cat1.title")}</CardTitle><CardDescription>{t("cookies.cat1.desc")}</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground"><ul className="list-disc pl-5 space-y-1"><li><code className="rounded bg-muted px-1 py-0.5 text-xs">better-auth.*</code> {t("cookies.cat1.li1")}</li><li><code className="rounded bg-muted px-1 py-0.5 text-xs">tgaw_consent</code> {t("cookies.cat1.li2")}</li><li><code className="rounded bg-muted px-1 py-0.5 text-xs">__Host-*</code> {t("cookies.cat1.li3")}</li></ul></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("cookies.cat2.title")}</CardTitle><CardDescription>{t("cookies.cat2.desc")}</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground"><p>{t("cookies.cat2.body")}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("cookies.cat3.title")}</CardTitle><CardDescription>{t("cookies.cat3.desc")}</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground"><p>{t("cookies.cat3.bodyA")} <code className="text-xs">analytics_storage</code>{t("cookies.cat3.bodyB")}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("cookies.cat4.title")}</CardTitle><CardDescription>{t("cookies.cat4.desc")}</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground"><p>{t("cookies.cat4.bodyA")} <code className="text-xs">ad_storage</code> {t("cookies.cat4.slash")} <code className="text-xs">ad_personalization</code>{t("cookies.cat4.bodyB")}</p></CardContent>
          </Card>
        </div>

        {/* Table */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("cookies.table.title")}</h2>
        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2">{t("cookies.th.cookie")}</th><th className="px-4 py-2">{t("cookies.th.category")}</th><th className="px-4 py-2">{t("cookies.th.purpose")}</th><th className="px-4 py-2">{t("cookies.th.duration")}</th><th className="px-4 py-2">{t("cookies.th.provider")}</th></tr>
              </thead>
              <tbody className="divide-y">
                {cookieTable.map((row) => (
                  <tr key={row.name} className="align-top">
                    <td className="px-4 py-2 font-mono text-xs">{row.name}</td>
                    <td className="px-4 py-2 text-xs"><Badge variant="secondary" className="text-[11px]">{t(row.categoryKey)}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{t(row.purposeKey)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs">{t(row.durationKey)}</td>
                    <td className="px-4 py-2 text-xs">{t(row.providerKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* GPC & Do Not Sell */}
        <div id="do-not-sell" className="scroll-mt-20">
          <h2 className="mt-12 text-2xl tracking-tight">{t("cookies.donotsell.title")}</h2>
          <Card className="mt-4">
            <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
              <p>{t("cookies.donotsell.p1")}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>{t("cookies.donotsell.li1a")} <span className="font-medium text-foreground">{t("cookies.donotsell.li1b")}</span> {t("cookies.donotsell.li1c")} <span className="font-medium text-foreground">{t("cookies.donotsell.li1d")}</span>{t("cookies.donotsell.li1e")}</li>
                <li>{t("cookies.donotsell.li2a")} <span className="font-medium text-foreground">{t("cookies.donotsell.li2b")}</span> {t("cookies.donotsell.li2c")} <code className="text-xs">Sec-GPC: 1</code> {t("cookies.donotsell.li2d")}</li>
                <li>{t("cookies.donotsell.li3a")} <code className="text-xs">tgaw_consent</code> {t("cookies.donotsell.li3b")} <code className="text-xs">ad_storage: denied</code>{t("cookies.donotsell.li3c")}</li>
              </ul>
              <div className="mt-4"><CookieManageButton /></div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-12 text-2xl tracking-tight">{t("cookies.manage.title")}</h2>
        <Card className="mt-4">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("cookies.manage.li1a")} <span className="font-medium text-foreground">{t("cookies.manage.li1b")}</span> {t("cookies.manage.li1c")}</li>
              <li>{t("cookies.manage.li2a")} <code className="text-xs">tgaw_consent</code> {t("cookies.manage.li2b")}</li>
              <li>{t("cookies.manage.li3")}</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-10" />

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>{t("cookies.contacta")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link></p>
          <Link href="/privacy" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("cookies.privacyBtn")} →</Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("cookies.footerNote")}</p>
      </main>
    </div>
  )
}