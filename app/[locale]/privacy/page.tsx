import type { Metadata } from "next";
import Link from "next/link"
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/i18n/config";
import {
  ShieldCheck,
  Cookie,
  Mail,
  Globe,
  Clock,
  Database,
  Eye,
  Trash2,
  Lock,
  Users,
  FileText,
  Scale,
} from "lucide-react"
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
  let title = "Privacy Policy — The Global Altar Watch";
  let description =
    "How TGAW collects, uses, and protects your personal information — GDPR, CCPA/CPRA, LGPD, POPIA, APPI, PIPA compliant.";
  try {
    const t = await getTranslations({ locale, namespace: "legal" });
    const translatedTitle = t("meta.privacy.title");
    const translatedDescription = t("meta.privacy.description");
    if (translatedTitle && translatedTitle !== "meta.privacy.title") title = translatedTitle;
    if (translatedDescription && translatedDescription !== "meta.privacy.description")
      description = translatedDescription;
  } catch {
    // English fallback — build never breaks on missing keys
  }
  const suffix = "/privacy";
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

export default async function PrivacyPage() {
  const t = await getTranslations("legal")
  const email = t("contactEmail")
  const domain = t("domain")

  const dataTable = [
    { key: "r1" },
    { key: "r2" },
    { key: "r3" },
    { key: "r4" },
  ]

  const rightsTable = [
    { key: "r1" },
    { key: "r2" },
    { key: "r3" },
    { key: "r4" },
    { key: "r5" },
    { key: "r6" },
    { key: "r7" },
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
          <Link href="/" className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            {t("backHome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-3.5" /> {t("privacy.badge")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe aria-hidden="true" className="size-3" /> {t("privacy.region")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock aria-hidden="true" className="size-3" /> {t("privacy.updated")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Scale aria-hidden="true" className="size-3" /> {t("privacy.compliance")}
          </Badge>
        </div>

        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">{t("privacy.title")}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {t("privacy.intro")}
        </p>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Cookie aria-hidden="true" className="size-4" /> {t("privacy.cookieNote")}
            </span>
            <CookieManageButton />
          </CardContent>
        </Card>

        {/* Overview cards */}
        <div className="mt-10 grid gap-2 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database aria-hidden="true" className="size-4 text-violet-600" /> {t("privacy.what.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("privacy.what.body")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Scale aria-hidden="true" className="size-4 text-emerald-600" /> {t("privacy.why.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("privacy.why.bodyA")} <span className="font-medium text-foreground">{t("privacy.why.emphasis")}</span> {t("privacy.why.bodyB")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye aria-hidden="true" className="size-4 text-sky-600" /> {t("privacy.controls.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("privacy.controls.bodyA")} <span className="font-medium text-foreground">{t("privacy.controls.emphasis")}</span>{t("privacy.controls.bodyB")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controller */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s1.title")}</h2>
        <Card className="mt-4">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{t("privacy.s1.p1a")}</span>{" "}
              {t("privacy.s1.p1b")}{" "}
              <Link href="/" className="cursor-pointer underline underline-offset-2 hover:text-foreground">
                {domain}
              </Link>
              {t("privacy.s1.p1c")}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                {t("privacy.s1.li1a")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link>
              </li>
              <li>{t("privacy.s1.li2")}</li>
              <li>
                {t("privacy.s1.li3")}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data categories */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s2.title")}</h2>
        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">{t("privacy.th.category")}</th>
                  <th className="px-4 py-2">{t("privacy.th.examples")}</th>
                  <th className="px-4 py-2">{t("privacy.th.purpose")}</th>
                  <th className="px-4 py-2">{t("privacy.th.basis")}</th>
                  <th className="px-4 py-2">{t("privacy.th.retention")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dataTable.map((row) => (
                  <tr key={row.key} className="align-top">
                    <td className="px-4 py-3 font-medium text-foreground">{t(`privacy.${row.key}.category`)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t(`privacy.${row.key}.examples`)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t(`privacy.${row.key}.purpose`)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{t(`privacy.${row.key}.basis`)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t(`privacy.${row.key}.retention`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="mt-4 border-dashed">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                {t("privacy.childrenNote")}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Purposes & bases */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s3.title")}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><FileText aria-hidden="true" className="size-4 text-primary" /> {t("privacy.contract.title")}</CardTitle>
              <CardDescription>{t("privacy.contract.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("privacy.contract.body")}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Lock aria-hidden="true" className="size-4 text-emerald-600" /> {t("privacy.interest.title")}</CardTitle>
              <CardDescription>{t("privacy.interest.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("privacy.interest.body")}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Cookie aria-hidden="true" className="size-4 text-amber-600" /> {t("privacy.consent.title")}</CardTitle>
              <CardDescription>{t("privacy.consent.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("privacy.consent.bodyA")} <span className="font-medium text-foreground">{t("privacy.consent.mid")}</span> {t("privacy.consent.bodyB")} <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.cookiesBtn")}</Link>{t("privacy.consent.end")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Scale aria-hidden="true" className="size-4 text-sky-600" /> {t("privacy.legal.title")}</CardTitle>
              <CardDescription>{t("privacy.legal.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("privacy.legal.body")}</CardContent>
          </Card>
        </div>

        {/* Cookies & signals */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s4.title")}</h2>
        <Card className="mt-4">
          <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              {t("privacy.s4.p1a")} <span className="font-medium text-foreground">{t("privacy.s4.geo")}</span> {t("privacy.s4.p1b")} <span className="font-medium text-foreground">{t("privacy.s4.donotsell")}</span>{t("privacy.s4.p1c")}{" "}
              <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.cookiesBtn")}</Link> {t("privacy.s4.p1d")}
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {t("privacy.s4.li1a")} <code className="text-xs">ad_storage</code>, <code className="text-xs">analytics_storage</code>, <code className="text-xs">ad_user_data</code> {t("privacy.s4.li1b")} <code className="text-xs">denied</code> {t("privacy.s4.li1d")}
              </li>
              <li>
                {t("privacy.s4.li2a")} <code className="text-xs">Sec-GPC: 1</code> {t("privacy.s4.li2b")}
              </li>
              <li>
                {t("privacy.s4.li3a")} <code className="text-xs">tgaw_consent</code> {t("privacy.s4.li3b")}
              </li>
            </ul>
            <div className="pt-2">
              <CookieManageButton />
            </div>
          </CardContent>
        </Card>

        {/* Sharing */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s5.title")}</h2>
        <Card className="mt-4">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            <p>{t("privacy.s5.p1")}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li><span className="font-medium text-foreground">{t("privacy.s5.li1a")}</span> {t("privacy.s5.li1b")}</li>
              <li><span className="font-medium text-foreground">{t("privacy.s5.li2a")}</span> {t("privacy.s5.li2b")}</li>
              <li><span className="font-medium text-foreground">{t("privacy.s5.li3a")}</span> {t("privacy.s5.li3b")}</li>
              <li><span className="font-medium text-foreground">{t("privacy.s5.li4a")}</span> {t("privacy.s5.li4b")}</li>
            </ul>
            <p className="mt-3">{t("privacy.s5.p2")}</p>
          </CardContent>
        </Card>

        {/* Retention */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s6.title")}</h2>
        <Card className="mt-4">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("privacy.s6.li1")}</li>
              <li>{t("privacy.s6.li2")}</li>
              <li>{t("privacy.s6.li3")}</li>
              <li>{t("privacy.s6.li4")}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Transfers */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s7.title")}</h2>
        <Card className="mt-4">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              {t("privacy.s7.p1a")} <span className="font-medium text-foreground">{t("privacy.s7.scc")}</span> {t("privacy.s7.p1b")}
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s8.title")}</h2>
        <Card className="mt-4">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            <p>{t("privacy.s8.p1")}</p>
          </CardContent>
        </Card>

        {/* Rights */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s9.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("privacy.s9.introA")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link> {t("privacy.s9.introB")}</p>
        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2">{t("privacy.rights.th.right")}</th><th className="px-4 py-2">{t("privacy.rights.th.eu")}</th><th className="px-4 py-2">{t("privacy.rights.th.us")}</th><th className="px-4 py-2">{t("privacy.rights.th.how")}</th></tr>
              </thead>
              <tbody className="divide-y">
                {rightsTable.map((r) => (
                  <tr key={r.key} className="align-top">
                    <td className="px-4 py-2 font-medium text-foreground">{t(`privacy.rights.${r.key}.right`)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{t(`privacy.rights.${r.key}.eu`)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{t(`privacy.rights.${r.key}.us`)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{t(`privacy.rights.${r.key}.how`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground"><Trash2 aria-hidden="true" className="size-4" /> {t("privacy.deletion.title")}</p>
              <p className="mt-1">{t("privacy.deletion.body")}</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground"><Eye aria-hidden="true" className="size-4" /> {t("privacy.donotsell.title")}</p>
              <p className="mt-1">{t("privacy.donotsell.bodyA")} <span className="font-medium text-foreground">{t("privacy.donotsell.mid")}</span>{t("privacy.donotsell.bodyB")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Changes */}
        <h2 className="mt-12 text-2xl tracking-tight">{t("privacy.s10.title")}</h2>
        <Card className="mt-4">
          <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
            <p>{t("privacy.s10.p1")}</p>
            <p>
              {t("privacy.s10.p2a")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link> {t("privacy.s10.p2b")} <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.cookiesBtn")}</Link> {t("privacy.s10.p2c")}{" "}
              <Link href="/terms" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.title")}</Link>{t("privacy.s10.p2d")}
            </p>
            <p className="text-xs">{t("privacy.s10.p3")}</p>
          </CardContent>
        </Card>

        <Separator className="my-10" />

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            {t("privacy.related")} <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.cookiesBtn")}</Link> ·{" "}
            <Link href="/terms" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.title")}</Link>
          </p>
          <Link href={`mailto:${email}`} className="inline-flex cursor-pointer items-center gap-1.5 hover:text-foreground">
            <Mail aria-hidden="true" className="size-3.5" /> {email}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("privacy.footerNote")}</p>
      </main>
    </div>
  )
}