import Link from "next/link"
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

export const metadata = {
  title: "Terms & Conditions — The Global Altar Watch",
  description: "Terms governing your use of TGAW — community, content, bookings, and global compliance.",
}

const atAGlance = [
  { icon: Heart, title: "A reverent community", text: "TGAW is a Christian watch — devotion, prayer, and fellowship. We guard it with kindness and truth." },
  { icon: Users, title: "Your content, your responsibility", text: "You keep ownership of what you share; you give us a license to show it in the community." },
  { icon: Lock, title: "Respect the watch", text: "No hate, harassment, spam, or impersonation. Leaders and moderators may hide or remove content." },
]

export default function TermsPage() {
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
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Scale aria-hidden="true" className="size-3.5" /> Terms & Conditions
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe aria-hidden="true" className="size-3" /> Global
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock aria-hidden="true" className="size-3" /> Effective Sep 2, 2026
          </Badge>
        </div>

        <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">Terms & Conditions</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          These Terms govern your use of The Global Altar Watch at{" "}
          <Link href="/" className="cursor-pointer underline underline-offset-2 hover:text-foreground">
            tgaw.app
          </Link>{" "}
          — the devotion slots, prayer rooms, community feed, messages, and groups. By creating an account or using the service, you agree to them.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/privacy" className="inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            Cookie Policy
          </Link>
        </div>

        {/* At a glance */}
        <div className="mt-10 grid gap-2 sm:grid-cols-3">
          {atAGlance.map((c) => (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <c.icon aria-hidden="true" className="size-4 text-primary" />
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 pt-6 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-medium">Plain-language summary, not a substitute for reading.</span> The cards above are a friendly overview — the numbered sections below are what you agree to. If you do not agree, please do not use TGAW.
            </p>
          </CardContent>
        </Card>

        {/* TOC */}
        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText aria-hidden="true" className="size-4" /> Contents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
              <li><a href="#eligibility" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Eligibility & accounts</a></li>
              <li><a href="#community" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Community guidelines</a></li>
              <li><a href="#content" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Your content & license</a></li>
              <li><a href="#bookings" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Slots, bookings & meetings</a></li>
              <li><a href="#conduct" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Acceptable use</a></li>
              <li><a href="#ip" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Intellectual property</a></li>
              <li><a href="#disclaimer" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Disclaimers</a></li>
              <li><a href="#liability" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Limitation of liability</a></li>
              <li><a href="#termination" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Suspension & termination</a></li>
              <li><a href="#law" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Governing law & disputes</a></li>
            </ol>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="mt-10 space-y-8">
          <section id="eligibility" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Users aria-hidden="true" className="size-5 text-muted-foreground" /> 1. Eligibility & accounts</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>You must be at least 13 years old to create an account (16 where local law requires). Provide accurate information and keep your password confidential. You are responsible for all activity under your account.</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>One account per person; do not impersonate others.</li>
                  <li>Notify us promptly if you suspect unauthorized use: <Link href="mailto:info@tgaw.app" className="cursor-pointer underline underline-offset-2 hover:text-foreground">info@tgaw.app</Link>.</li>
                  <li>We may require email verification before enabling community features.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="community" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Heart aria-hidden="true" className="size-5 text-muted-foreground" /> 2. Community guidelines</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>TGAW is a house of prayer for all nations. We ask every member to watch in love:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Be respectful — no hate speech, harassment, or personal attacks. Disagreement without dishonor.</li>
                  <li>No spam, unsolicited promotion, or repetitive posting.</li>
                  <li>Prayer requests and testimonies are sacred — do not share another member’s sensitive story outside the community without consent.</li>
                  <li>Leaders, coordinators, and moderators may hide, limit, or remove content that breaches these guidelines, consistent with our moderation process.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="content" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><BookOpen aria-hidden="true" className="size-5 text-muted-foreground" /> 3. Your content & license</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>You retain ownership of the text, images, tracts, prayers, and media you share. By posting, you grant TGAW a non-exclusive, worldwide, royalty-free license to host, display, and distribute that content within the service (including to other members via feed, messages, and groups) for as long as it remains visible.</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>You represent that you have the rights to share what you post and that it does not infringe others’ rights.</li>
                  <li>You can delete your posts/comments; deletion removes them from the feed, though others may have already seen or quoted them.</li>
                  <li>Feedback and suggestions you send may be used without obligation.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="bookings" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Clock aria-hidden="true" className="size-5 text-muted-foreground" /> 4. Slots, bookings & meetings</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>Devotion slots (Bible, Prayer, Worship) are 1-hour commitments. One booking per slot per member; use consecutive slots if you desire a longer watch. Daily limits per type are set by the community (see Booking page).</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Cancel from the slot timeline if you cannot keep a time — it frees the slot for another member.</li>
                  <li>Meeting links (Zoom/Teams) are provided per devotion type per day; treat them as community spaces.</li>
                  <li>We may block or release slots for special gatherings; displaced bookings are restored when the block ends.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="conduct" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Ban aria-hidden="true" className="size-5 text-muted-foreground" /> 5. Acceptable use</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>You agree not to:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Violate law, or upload unlawful, infringing, or harmful content.</li>
                  <li>Attempt to access accounts, data, or systems without authorization (including scraping or reverse engineering beyond normal browser use).</li>
                  <li>Interfere with the service (flooding bookings, spamming messages, evading bans).</li>
                  <li>Use prayer or messaging features for harassment, solicitation, or non-consensual outreach.</li>
                </ul>
                <p>We may rate-limit, throttle, or restrict features to protect the community.</p>
              </CardContent>
            </Card>
          </section>

          <section id="ip" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Gavel aria-hidden="true" className="size-5 text-muted-foreground" /> 6. Intellectual property</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>The TGAW name, logo, and platform software are owned by TGAW or its licensors and are protected by copyright, trademark, and other laws. No license is granted except to use the service as intended.</p>
                <p>If you believe content infringes your rights, contact <Link href="mailto:info@tgaw.app" className="cursor-pointer underline underline-offset-2 hover:text-foreground">info@tgaw.app</Link> with the details (DMCA-style notice where applicable); we will act promptly.</p>
              </CardContent>
            </Card>
          </section>

          <section id="disclaimer" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><AlertTriangle aria-hidden="true" className="size-5 text-muted-foreground" /> 7. Disclaimers</h2>
            <Card className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                <p>TGAW provides community and devotional tools, not professional pastoral, counseling, legal, or medical advice. Prayer, testimonies, and encouragement are spiritual support, not substitutes for professional care.</p>
                <p>The service is provided “as is” and “as available” without warranties of any kind, to the fullest extent allowed by law.</p>
              </CardContent>
            </Card>
          </section>

          <section id="liability" className="scroll-mt-20">
            <h2 className="text-2xl tracking-tight">8. Limitation of liability</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>To the fullest extent permitted by applicable law, TGAW and its leaders, contributors, and hosts are not liable for indirect, incidental, consequential, or punitive damages arising from your use of the service, even if advised of the possibility.</p>
                <p>Where liability cannot be excluded, it is limited to the greater of (a) the amount you paid to TGAW in the 6 months before the claim (currently most use is free) or (b) €/US$100.</p>
                <p>Nothing in these Terms limits liability for fraud, willful misconduct, or where the law does not permit limitation.</p>
              </CardContent>
            </Card>
          </section>

          <section id="termination" className="scroll-mt-20">
            <h2 className="text-2xl tracking-tight">9. Suspension & termination</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>We may suspend or terminate accounts or remove content that breaches these Terms, harms the community, or creates risk — including temporary bans, permanent bans, and content hiding by leaders/superadmins as described in the app.</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>You can delete your account in Settings at any time; some content may remain if already shared with others or retained for legal/ abuse-prevention reasons.</li>
                  <li>Appeal a moderation action by emailing <Link href="mailto:info@tgaw.app" className="cursor-pointer underline underline-offset-2 hover:text-foreground">info@tgaw.app</Link> with subject “Appeal”.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="law" className="scroll-mt-20">
            <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Scale aria-hidden="true" className="size-5 text-muted-foreground" /> 10. Governing law & disputes</h2>
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>These Terms are governed by the laws specified at deployment time (and, where you are a consumer, the mandatory protections of your home jurisdiction still apply). We hope to resolve concerns informally — please contact us first. Formal disputes may be brought in the competent courts of the governing jurisdiction, or in your local courts where the law gives you that right.</p>
                <p>For EU consumers, information on alternative dispute resolution is available via the EU ODR platform.</p>
              </CardContent>
            </Card>
          </section>

          <section id="changes" className="scroll-mt-20">
            <h2 className="text-2xl tracking-tight">11. Changes to these Terms</h2>
            <Card className="mt-4">
              <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>We may update these Terms as the community and laws evolve. Material changes will be posted here with a new effective date; continued use after the date means you accept the updated Terms. If changes are significant, we will also notify signed-in members in-app.</p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail aria-hidden="true" className="size-4" /> Contact
              </CardTitle>
              <CardDescription>Questions about these Terms, or need an appeal?</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Email <Link href="mailto:info@tgaw.app" className="cursor-pointer underline underline-offset-2 hover:text-foreground">info@tgaw.app</Link> — subject “Terms”.
              </p>
              <p className="mt-2">
                Related: <Link href="/privacy" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Privacy Policy</Link> ·{" "}
                <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">Cookie Policy</Link>
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10" />

        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} The Global Altar Watch. All rights reserved. These Terms do not create pastoral or fiduciary duties.</p>
      </main>
    </div>
  )
}