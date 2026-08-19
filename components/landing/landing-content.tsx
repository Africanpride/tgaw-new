"use client";

import {
  ArrowRight,
  BookOpen,
  Church,
  Flame,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import FooterSectionTwo from "@/components/blocks/footer/footer-section-two";
import { CountUp } from "@/components/landing/count-up";
import { ThemeToggle } from "@/components/theme-toggle";
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

const STATS = [
  { icon: Users, label: "Active Believers", value: 50, suffix: "K+" },
  { icon: Church, label: "Prayer Sessions", value: 1.2, suffix: "M", decimals: 1 },
  { icon: BookOpen, label: "Books Covered", value: 66, suffix: "" },
  { icon: Heart, label: "Member Satisfaction", value: 98, suffix: "%" },
];

const FEATURES = [
  {
    icon: Flame,
    title: "Daily Devotion",
    description:
      "Slot-based Bible reading, prayer, and worship you can actually commit to — with live Zoom links and reminders.",
  },
  {
    icon: MessagesSquare,
    title: "Real-Time Fellowship",
    description:
      "Group prayer circles, Bible study chats, and instant messages with believers worldwide.",
  },
  {
    icon: BookOpen,
    title: "Verse of the Day",
    description:
      "A fresh scripture every morning, shareable in one tap — start your day anchored in the Word.",
  },
  {
    icon: Users,
    title: "Community Stories",
    description:
      "Testimonies, praise reports, and prayer requests that keep the whole altar watch together.",
  },
  {
    icon: Church,
    title: "Calendar of Watch",
    description:
      "Your devotional schedule on one shared calendar — sync it to Google, Apple, or Outlook.",
  },
  {
    icon: Sparkles,
    title: "Guided Structure",
    description:
      "Bible reading plans and progress streaks keep your habit alive day after day.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah R.",
    role: "Prayer Coordinator",
    text: "The daily prayer slots changed my mornings. I've never kept a devotional habit this consistently.",
  },
  {
    name: "David K.",
    role: "Bible Study Lead",
    text: "Having a fixed reading slot with brothers and sisters on Zoom makes the Word come alive.",
  },
  {
    name: "Grace A.",
    role: "Worship Team",
    text: "Beautiful, simple, and deeply reverent. This is what community devotion should feel like.",
  },
];

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Community", href: "#community" },
  { label: "Testimonials", href: "#testimonials" },
];

export function LandingContent({ verseSlot }: { verseSlot?: React.ReactNode }) {
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
            ? "border-b bg-background/80 shadow-sm backdrop-blur-md"
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
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {isLoggedIn ? (
              <>
                <Link href="/overview" className="cursor-pointer">
                  <Button variant="ghost" className="cursor-pointer gap-2">
                    <ArrowRight className="size-4" aria-hidden="true" />
                    Dashboard
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
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="cursor-pointer">
                  <Button variant="ghost" className="cursor-pointer gap-2">
                    <LogIn className="size-4" aria-hidden="true" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="cursor-pointer">
                  <Button className="cursor-pointer gap-2">
                    <UserPlus className="size-4" aria-hidden="true" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
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
                  <SheetTitle className="text-left">Menu</SheetTitle>
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
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  <div className="my-2 h-px bg-border" />
                  {isLoggedIn ? (
                    <Link href="/overview" onClick={() => setMobileOpen(false)} className="cursor-pointer">
                      <Button className="w-full cursor-pointer gap-2">
                        <ArrowRight className="size-4" aria-hidden="true" />
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup" onClick={() => setMobileOpen(false)} className="cursor-pointer">
                        <Button className="w-full cursor-pointer gap-2">
                          <UserPlus className="size-4" aria-hidden="true" />
                          Get Started Free
                        </Button>
                      </Link>
                      <Link href="/login" onClick={() => setMobileOpen(false)} className="cursor-pointer">
                        <Button variant="outline" className="w-full cursor-pointer gap-2">
                          <LogIn className="size-4" aria-hidden="true" />
                          Sign In
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
        <section className="relative overflow-hidden px-6 pb-20 pt-32 text-center sm:pb-28 sm:pt-40">
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
                Your Daily Faith Companion
              </Badge>
            </motion.div>
            <motion.h1
              variants={staggerItem}
              className="text-5xl leading-[1.05] tracking-tight sm:text-7xl"
            >
              The Global{" "}
              <span className="bg-linear-to-r from-primary via-fuchsia-500 to-red-500 bg-clip-text text-transparent">
                Altar
              </span>{" "}
              Watch
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="max-w-2xl text-lg text-muted-foreground"
            >
              A modern Christian community platform for daily devotion, prayer,
              Bible reading, and fellowship with believers worldwide.
            </motion.p>
            <motion.div
              variants={staggerItem}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              {isLoggedIn ? (
                <Link href="/overview" className="cursor-pointer">
                  <Button size="lg" className="cursor-pointer gap-2">
                    <ArrowRight className="size-4" aria-hidden="true" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="cursor-pointer">
                    <Button size="lg" className="cursor-pointer gap-2">
                      <UserPlus className="size-4" aria-hidden="true" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login" className="cursor-pointer">
                    <Button
                      size="lg"
                      variant="outline"
                      className="cursor-pointer gap-2"
                    >
                      <LogIn className="size-4" aria-hidden="true" />
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y bg-muted/50 px-6 py-16">
          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={staggerItem}>
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
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
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-24 px-6 py-20 sm:py-24">
          <motion.div
            variants={reduceMotion ? undefined : fadeInUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge variant="secondary">Everything for the Watch</Badge>
            <h2 className="mt-4 text-4xl sm:text-5xl">One faithful habit, every day</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Everything you need to keep a consistent devotional life, together
              with believers around the world.
            </p>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={staggerItem} className="h-full">
                <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-sm">
                  <CardHeader>
                    <span className="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <feature.icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Verse of the Day ── */}
        {verseSlot ? (
          <section className="px-6 py-16">
            <div className="mx-auto max-w-4xl">{verseSlot}</div>
          </section>
        ) : null}

        {/* ── Community teaser ── */}
        <section
          id="community"
          className="scroll-mt-24 border-t bg-muted/50 px-6 py-16"
        >
          <motion.div
            variants={reduceMotion ? undefined : fadeInUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center"
          >
            <Badge variant="secondary">Grow Together</Badge>
            <h2 className="text-3xl sm:text-4xl">Never watch alone</h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              Join prayer circles, share testimonies, and encourage believers —
              every day, from anywhere.
            </p>
            <Link href="/feed" className="cursor-pointer">
              <Button size="lg" className="cursor-pointer gap-2">
                Explore the Community
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* ── Testimonials ── */}
        <section
          id="testimonials"
          className="scroll-mt-24 px-6 py-20 sm:py-24"
        >
          <motion.div
            variants={reduceMotion ? undefined : fadeInUp}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <Badge variant="secondary">Loved by the Watch</Badge>
            <h2 className="mt-4 text-4xl sm:text-5xl">Stories from the altar</h2>
          </motion.div>

          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={staggerItem} className="h-full">
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <p className="text-3xl leading-none text-primary">“</p>
                    <p className="flex-1 leading-relaxed text-foreground/90">
                      {t.text}
                    </p>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
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