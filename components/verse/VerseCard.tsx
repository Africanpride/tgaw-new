import { BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getVerseOfDay } from "@/lib/services/verseService"
import { VerseShareDialog } from "@/components/verse/VerseShareDialog"

export async function VerseCard() {
  const verse = await getVerseOfDay()

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-snug text-foreground">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {verse.reference}
            </span>
            <Badge variant="secondary" className="shrink-0">
              Verse of the Day
            </Badge>
          </p>
        </div>
        <VerseShareDialog
          verse={{ text: verse.text, reference: verse.reference }}
        />
      </CardContent>
    </Card>
  )
}
