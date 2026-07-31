import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-xl font-bold">
          TGA<span className="text-red-500">W</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="cursor-pointer">
            <Button variant="ghost" className="cursor-pointer">
              Sign In
            </Button>
          </Link>
          <Link href="/signup" className="cursor-pointer">
            <Button className="cursor-pointer">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
          <Badge variant="secondary">Your Daily Faith Companion</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            The Global <span className="italic text-red-500">Altar</span> Watch
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A modern Christian community platform for daily devotion, prayer,
            Bible reading, and fellowship with believers worldwide.
          </p>
          <div className="flex gap-4">
            <Link href="/signup" className="cursor-pointer">
              <Button size="lg" className="cursor-pointer">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login" className="cursor-pointer">
              <Button size="lg" variant="outline" className="cursor-pointer">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50 px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
                <div className="text-3xl font-bold">50K+</div>
                <p className="text-sm text-muted-foreground">Active Believers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
                <div className="text-3xl font-bold">1.2M</div>
                <p className="text-sm text-muted-foreground">Prayer Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
                <div className="text-3xl font-bold">66</div>
                <p className="text-sm text-muted-foreground">Books Covered</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
                <div className="text-3xl font-bold">98%</div>
                <p className="text-sm text-muted-foreground">Member Satisfaction</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} The Global Altar Watch. All rights reserved.
      </footer>
    </div>
  )
}
