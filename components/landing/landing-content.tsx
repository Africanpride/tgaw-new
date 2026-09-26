"use client";

import {
  ArrowRight,
  BookOpen,
  Church,
  Flame,
  Globe,
  Heart,
  LogIn,
  Menu,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import FooterSectionTwo from "@/components/blocks/footer/footer-section-two";
import { CountUp } from "@/components/landing/count-up";
import { IconTile } from "@/components/IconTile";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageDialog } from "@/components/i18n/LanguageDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  staggerContainer,
  staggerItem,
  fadeInUp,
} from "@/lib/motion";
import { signOut, useSession } from "@/lib/auth-client";

const STATS: { icon: LucideIcon; key: string; value: number; suffix: string; decimals?: number }[] = [
  { icon: Users, key: "stats.activeMembers", value: 50, suffix: "K+" },
  { icon: Church, key: "stats.prayerSessions", value: 1.2, suffix: "M", decimals: 1 },
  { icon: BookOpen, key: "stats.booksCovered", value: 66, suffix: "" },
  { icon: Heart, key: "stats.satisfaction", value: 98, suffix: "%" },
];

const FEATURES = [
  {
    icon: Flame,
    titleKey: "features.devotion.title",
    descriptionKey: "features.devotion.description",
  },
  {
    icon: MessagesSquare,
    titleKey: "features.fellowship.title",
    descriptionKey: "features.fellowship.description",
  },
  {
    icon: BookOpen,
    titleKey: "features.verse.title",
    descriptionKey: "features.verse.description",
  },
  {
    icon: Users,
    titleKey: "features.community.title",
    descriptionKey: "features.community.description",
  },
  {
    icon: Church,
    titleKey: "features.calendar.title",
    descriptionKey: "features.calendar.description",
  },
  {
    icon: Sparkles,
    titleKey: "features.guided.title",
    descriptionKey: "features.guided.description",
  },
] as const;

const TESTIMONIALS = [
  { nameKey: "testimonials.t1.name", roleKey: "testimonials.t1.role", textKey: "testimonials.t1.text" },
  { nameKey: "testimonials.t2.name", roleKey: "testimonials.t2.role", textKey: "testimonials.t2.text" },
  { nameKey: "testimonials.t3.name", roleKey: "testimonials.t3.role", textKey: "testimonials.t3.text" },
] as const;

const NAV_ITEMS = [
  { key: "nav.features", href: "#features" },
  { key: "nav.community", href: "#community" },
  { key: "nav.testimonials", href: "#testimonials" },
] as const;

export function LandingContent({ verseSlot }: { verseSlot?: React.ReactNode }) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky navbar ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b bg-background/80 shadow-xs backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex cursor-pointer items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              TGA<span className="text-red-500">W</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="cursor-pointer">
                <Button variant="ghost" className="cursor-pointer font-medium">
                  {tc(item.key)}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <LanguageDialog />
            {isLoggedIn ? (
              <>
                <Link href="/overview" className="cursor-pointer">
                  <Button variant="ghost" className="cursor-pointer gap-2">
                    <ArrowRight className="size-4" aria-hidden="true" />
                    {tc("nav.dashboard")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="cursor-pointer gap-2"
                  onClick={async () => {
                    await signOut();
                    router.push("/");
                  }}
                >
                  {tc("nav.signOut")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="cursor-pointer">
                  <Button variant="ghost" className="cursor-pointer gap-2">
                    <LogIn className="size-4" aria-hidden="true" />
                    {tc("nav.signIn")}
                  </Button>
                </Link>
                <Link href="/signup" className="cursor-pointer">
                  <Button className="cursor-pointer gap-2">
                    <UserPlus className="size-4" aria-hidden="true" />
                    {tc("nav.getStarted")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <LanguageDialog />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tc("nav.openMenu")}
                  className="cursor-pointer"
                >
                  {mobileOpen ? (
                    <X className="size-5" aria-hidden="true" />
                  ) : (
                    <Menu className="size-5" aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-left">{tc("nav.menu")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="cursor-pointer"
                    >
                      <Button variant="ghost" className="w-full cursor-pointer justify-start">
                        {tc(item.key)}
                      </Button>
                    </Link>
                  ))}
                  <div className="my-2 h-px bg-border" />
                  <LanguageDialog label={tc("nav.language")} />
                  {isLoggedIn ? (
                    <Link href="/overview" onClick={() => setMobileOpen(false)} className="cursor-pointer">
                      <Button className="w-full cursor-pointer gap-2">
                        <ArrowRight className="size-4" aria-hidden="true" />
                        {tc("nav.goToDashboard")}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup" onClick={() => setMobileOpen(false)} className="cursor-pointer">
                        <Button className="w-full cursor-pointer gap-2">
                          <UserPlus className="size-4" aria-hidden="true" />
                          {tc("nav.getStartedFree")}
                        </Button>
                      </Link>
                      <Link href="/login" onClick={() => setMobileOpen(false)} className="cursor-pointer">
                        <Button variant="outline" className="w-full cursor-pointer gap-2">
                          <LogIn className="size-4" aria-hidden="true" />
                          {tc("nav.signIn")}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-2 pb-20 pt-32 text-center sm:px-6 sm:pb-28 sm:pt-40">
          {/* ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-96 max-w-3xl rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            className="relative mx-auto flex max-w-3xl flex-col items-center gap-6"
          >
            <motion.div variants={staggerItem}>
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t("hero.badge")}
              </Badge>
            </motion.div>
            <motion.h1
              variants={staggerItem}
              className="text-5xl leading-[1.05] tracking-tight sm:text-7xl"
            >
              {t.rich("hero.title", {
                gradient: (chunks) => (
                  <span className="bg-linear-to-r from-primary via-fuchsia-500 to-red-500 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="max-w-2xl text-lg text-muted-foreground"
            >
              {t("hero.subtitle")}
            </motion.p>
            <motion.div
              variants={staggerItem}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              {isLoggedIn ? (
                <Link href="/overview" className="cursor-pointer">
                  <Button size="lg" className="cursor-pointer gap-2">
                    <ArrowRight className="size-4" aria-hidden="true" />
                    {tc("nav.goToDashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="cursor-pointer">
                    <Button size="lg" className="cursor-pointer gap-2">
                      <UserPlus className="size-4" aria-hidden="true" />
                      {tc("nav.getStartedFree")}
                    </Button>
                  </Link>
                  <Link href="/login" className="cursor-pointer">
                    <Button
                      size="lg"
                      variant="outline"
                      className="cursor-pointer gap-2"
                    >
                      <LogIn className="size-4" aria-hidden="true" />
                      {tc("nav.signIn")}
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y bg-muted/50 px-2 py-16 sm:px-6">
          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.key} variants={staggerItem}>
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center gap-2 pt-2 text-center sm:pt-6">
                    <stat.icon
                      className="size-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <CountUp
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.decimals}
                      className="text-3xl font-bold tabular-nums"
                    />
                    <p className="text-sm text-muted-foreground">{t(stat.key)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-24 px-2 py-20 sm:px-6 sm:py-24">
          <motion.div
            variants={reduceMotion ? undefined : fadeInUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge variant="secondary">{t("features.badge")}</Badge>
            <h2 className="mt-4 text-4xl sm:text-5xl">{t("features.title")}</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {t("features.subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.titleKey} variants={staggerItem} className="h-full">
                <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-sm">
                  <CardHeader>
                    <IconTile icon={feature.icon} size="md" className="mb-2 inline-flex" />
                    <CardTitle>{t(feature.titleKey)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {t(feature.descriptionKey)}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Verse of the Day ── */}
        {verseSlot ? (
          <section className="px-2 py-16 sm:px-6">
            <div className="mx-auto max-w-4xl">{verseSlot}</div>
          </section>
        ) : null}

        {/* ── Community teaser ── */}
        <section
          id="community"
          className="scroll-mt-24 border-t bg-muted/50 px-2 py-16 sm:px-6"
        >
          <motion.div
            variants={reduceMotion ? undefined : fadeInUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center"
          >
            <Badge variant="secondary">{t("community.badge")}</Badge>
            <h2 className="text-3xl sm:text-4xl">{t("community.title")}</h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t("community.subtitle")}
            </p>
            <Link href="/feed" className="cursor-pointer">
              <Button size="lg" className="cursor-pointer gap-2">
                {t("community.cta")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* ── Testimonials ── */}
        <section
          id="testimonials"
          className="scroll-mt-24 px-2 py-20 sm:px-6 sm:py-24"
        >
          <motion.div
            variants={reduceMotion ? undefined : fadeInUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge variant="secondary">{t("testimonials.badge")}</Badge>
            <h2 className="mt-4 text-4xl sm:text-5xl">{t("testimonials.title")}</h2>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto grid max-w-5xl gap-2 md:grid-cols-3"
          >
            {TESTIMONIALS.map((item) => (
              <motion.div key={item.nameKey} variants={staggerItem} className="h-full">
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-4 p-2 sm:p-6">
                    <p className="text-3xl leading-none text-primary">“</p>
                    <p className="flex-1 leading-relaxed text-foreground/90">
                      {t(item.textKey)}
                    </p>
                    <div>
                      <p className="font-medium">{t(item.nameKey)}</p>
                      <p className="text-sm text-muted-foreground">{t(item.roleKey)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <FooterSectionTwo />
    </div>
  );
}