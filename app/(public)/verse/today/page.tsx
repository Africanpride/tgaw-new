import { BookOpen } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getVerseOfDay } from "@/lib/services/verseService"
import { VerseShareDialog } from "@/components/verse/VerseShareDialog"

export default function VerseOfTheDayPage() {
  const verse = getVerseOfDay()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <Badge variant="secondary">Verse of the Day</Badge>
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="size-7" aria-hidden="true" />
        </div>
        <h1 className="max-w-3xl text-3xl leading-snug sm:text-4xl">
          &ldquo;{verse.text}&rdquo;
        </h1>
        <p className="font-medium text-muted-foreground">{verse.reference}</p>
        <VerseShareDialog verse={{ text: verse.text, reference: verse.reference }} />
        <Link href="/" className="cursor-pointer">
          <Button variant="link" className="cursor-pointer">
            Go to The Global Altar Watch
          </Button>
        </Link>
      </main>
    </div>
  )
}
