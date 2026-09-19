import type { Metadata } from "next";
import Link from "next/link"
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/i18n/config";
import {
  ShieldCheck,
  Scale,
  FileText,
  Users,
  Heart,
  Lock,
  AlertTriangle,
  Clock,
  Mail,
  BookOpen,
  Gavel,
  Ban,
  Globe,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let title = "Terms & Conditions — The Global Altar Watch";
  let description =
    "Terms governing your use of TGAW — community, content, bookings, and global compliance.";
  try {
    const t = await getTranslations({ locale, namespace: "legal" });
    const translatedTitle = t("meta.terms.title");
    const translatedDescription = t("meta.terms.description");
    if (translatedTitle && translatedTitle !== "meta.terms.title") title = translatedTitle;
    if (translatedDescription && translatedDescription !== "meta.terms.description")
      description = translatedDescription;
  } catch {
    // English fallback — build never breaks on missing keys
  }
  const suffix = "/terms";
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

export default async function TermsPage() {
  const t = await getTranslations("legal")

  const atAGlance = [
    { icon: Heart, titleKey: "terms.glance1.title", textKey: "terms.glance1.text" },
    { icon: Users, titleKey: "terms.glance2.title", textKey: "terms.glance2.text" },
    { icon: Lock, titleKey: "terms.glance3.title", textKey: "terms.glance3.text" },
  ]

  const tocItems = [
    { href: "#eligibility", key: "terms.toc1" },
    { href: "#community", key: "terms.toc2" },
    { href: "#content", key: "terms.toc3" },
    { href: "#bookings", key: "terms.toc4" },
    { href: "#conduct", key: "terms.toc5" },
    { href: "#ip", key: "terms.toc6" },
    { href: "#disclaimer", key: "terms.toc7" },
    { href: "#liability", key: "terms.toc8" },
    { href: "#termination", key: "terms.toc9" },
    { href: "#law", key: "terms.toc10" },
  ]

  const email = t("contactEmail")
  const domain = t("domain")

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
            <Scale aria-hidden="true" className="size-3.5" /> {t("terms.badge")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe aria-hidden="true" className="size-3" /> {t("terms.region")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock aria-hidden="true" className="size-3" /> {t("terms.effective")}
          </Badge>
        </div>

        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">{t("terms.title")}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {t("terms.introA")}{" "}
          <Link href="/" className="cursor-pointer underline underline-offset-2 hover:text-foreground">
            {domain}
          </Link>{" "}
          {t("terms.introB")}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/privacy" className="inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            {t("terms.privacyBtn")}
          </Link>
          <Link href="/cookies" className="inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            {t("terms.cookiesBtn")}
          </Link>
        </div>

        {/* At a glance */}
        <div className="mt-10 grid gap-2 sm:grid-cols-3">
          {atAGlance.map((c) => (
            <Card key={c.titleKey}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <c.icon aria-hidden="true" className="size-4 text-primary" />
                  {t(c.titleKey)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t(c.textKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 pt-6 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-medium">{t("terms.noticeTitle")}</span> {t("terms.noticeBody")}
            </p>
          </CardContent>
        </Card>

        {/* TOC */}
        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText aria-hidden="true" className="size-4" /> {t("terms.toc")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
              {tocItems.map((item) => (
                <li key={item.href}><a href={item.href} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t(item.key)}</a></li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="mt-10 space-y-8">
          <section id="eligibility" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Users aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s1.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s1.p1")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>{t("terms.s1.li1")}</li>
                  <li>{t("terms.s1.li2a")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link>{t("terms.s1.li2b")}</li>
                  <li>{t("terms.s1.li3")}</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="community" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Heart aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s2.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s2.p1")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>{t("terms.s2.li1")}</li>
                  <li>{t("terms.s2.li2")}</li>
                  <li>{t("terms.s2.li3")}</li>
                  <li>{t("terms.s2.li4")}</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="content" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><BookOpen aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s3.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s3.p1")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>{t("terms.s3.li1")}</li>
                  <li>{t("terms.s3.li2")}</li>
                  <li>{t("terms.s3.li3")}</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="bookings" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Clock aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s4.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s4.p1")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>{t("terms.s4.li1")}</li>
                  <li>{t("terms.s4.li2")}</li>
                  <li>{t("terms.s4.li3")}</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="conduct" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Ban aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s5.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s5.p1")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>{t("terms.s5.li1")}</li>
                  <li>{t("terms.s5.li2")}</li>
                  <li>{t("terms.s5.li3")}</li>
                  <li>{t("terms.s5.li4")}</li>
                </ul>
                <p>{t("terms.s5.p2")}</p>
              </CardContent>
            </Card>
          </section>

          <section id="ip" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Gavel aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s6.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s6.p1")}</p>
                <p>{t("terms.s6.p2a")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link> {t("terms.s6.p2b")}</p>
              </CardContent>
            </Card>
          </section>

          <section id="disclaimer" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><AlertTriangle aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s7.title")}</h2>
            <Card className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                <p>{t("terms.s7.p1")}</p>
                <p>{t("terms.s7.p2")}</p>
              </CardContent>
            </Card>
          </section>

          <section id="liability" className="scroll-mt-20">
            <h2 className="text-2xl tracking-tight">{t("terms.s8.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s8.p1")}</p>
                <p>{t("terms.s8.p2")}</p>
                <p>{t("terms.s8.p3")}</p>
              </CardContent>
            </Card>
          </section>

          <section id="termination" className="scroll-mt-20">
            <h2 className="text-2xl tracking-tight">{t("terms.s9.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s9.p1")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>{t("terms.s9.li1")}</li>
                  <li>{t("terms.s9.li2a")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link> {t("terms.s9.li2b")}</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="law" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Scale aria-hidden="true" className="size-5 text-muted-foreground" /> {t("terms.s10.title")}</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s10.p1")}</p>
                <p>{t("terms.s10.p2")}</p>
              </CardContent>
            </Card>
          </section>

          <section id="changes" className="scroll-mt-20">
            <h2 className="text-2xl tracking-tight">{t("terms.s11.title")}</h2>
            <Card className="mt-4">
              <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>{t("terms.s11.p1")}</p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail aria-hidden="true" className="size-4" /> {t("terms.contact.title")}
              </CardTitle>
              <CardDescription>{t("terms.contact.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                {t("terms.contact.a")} <Link href={`mailto:${email}`} className="cursor-pointer underline underline-offset-2 hover:text-foreground">{email}</Link> {t("terms.contact.subject")}
              </p>
              <p className="mt-2">
                {t("terms.contact.related")} <Link href="/privacy" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.privacyBtn")}</Link> ·{" "}
                <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("terms.cookiesBtn")}</Link>
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10" />

        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} The Global Altar Watch. All rights reserved. {t("terms.footerNote")}</p>
      </main>
    </div>
  )
}