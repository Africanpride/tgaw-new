"use client"

import { useEffect, useState } from "react"
import { Copy, ExternalLink, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type MeetingLink = {
  url: string | null
  label: string | null
}

type MeetingLinks = {
  BIBLE: MeetingLink
  PRAYER: MeetingLink
  PRAISE_WORSHIP: MeetingLink
}

type ActiveHosts = {
  BIBLE: string | null
  PRAYER: string | null
  PRAISE_WORSHIP: string | null
}

const DEFAULT_TITLES = {
  BIBLE: "Bible Reading",
  PRAYER: "Morning Intercession",
  PRAISE_WORSHIP: "Praise & Worship",
}

interface MeetingBannerProps {
  initialLinks?: MeetingLinks
  initialHosts?: ActiveHosts
}

export function MeetingBanner({ initialLinks, initialHosts }: MeetingBannerProps) {
  const [links, setLinks] = useState<MeetingLinks>(
    initialLinks ?? {
      BIBLE: { url: null, label: null },
      PRAYER: { url: null, label: null },
      PRAISE_WORSHIP: { url: null, label: null },
    }
  )
  const [loaded, setLoaded] = useState(Boolean(initialLinks))

  useEffect(() => {
    let isMounted = true

    async function fetchMeetingLinks() {
      try {
        const res = await fetch("/api/v1/slots?date=DEFAULT")
        const json = await res.json()
        if (isMounted && json.success && json.data?.meetingLinks) {
          setLinks({
            BIBLE: json.data.meetingLinks.BIBLE ?? { url: null, label: null },
            PRAYER: json.data.meetingLinks.PRAYER ?? { url: null, label: null },
            PRAISE_WORSHIP: json.data.meetingLinks.PRAISE_WORSHIP ?? {
              url: null,
              label: null,
            },
          })
        }
      } catch {
        // Keep fallback state
      } finally {
        if (isMounted) {
          setLoaded(true)
        }
      }
    }

    if (!initialLinks) {
      fetchMeetingLinks()
    }

    return () => {
      isMounted = false
    }
  }, [initialLinks])

  const extractMeetingId = (url: string | null) => {
    if (!url) return "—"
    try {
      const match = url.match(/zoom\.us\/j\/(\d+)/i)
      if (match && match[1]) return match[1]
      const clean = url.replace(/^https?:\/\//i, "").split("?")[0]
      return clean.length > 20 ? `${clean.slice(0, 17)}...` : clean
    } catch {
      return "—"
    }
  }

  const handleCopyLink = async (url: string | null, title: string) => {
    if (!url) {
      toast.error("No link available to copy")
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`${title} link copied to clipboard`)
    } catch {
      toast.error("Failed to copy link to clipboard")
    }
  }

  if (!loaded) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    )
  }

  const sections: Array<{
    key: keyof MeetingLinks
    title: string
    host: string | null
    passcode: string
  }> = [
    {
      key: "BIBLE",
      title: links.BIBLE.label || DEFAULT_TITLES.BIBLE,
      host: initialHosts?.BIBLE ?? null,
      passcode: "TGAW2026",
    },
    {
      key: "PRAYER",
      title: links.PRAYER.label || DEFAULT_TITLES.PRAYER,
      host: initialHosts?.PRAYER ?? null,
      passcode: "TGAW2026",
    },
    {
      key: "PRAISE_WORSHIP",
      title: links.PRAISE_WORSHIP.label || DEFAULT_TITLES.PRAISE_WORSHIP,
      host: initialHosts?.PRAISE_WORSHIP ?? null,
      passcode: "TGAW2026",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {sections.map((section) => {
        const link = links[section.key]
        const meetingId = extractMeetingId(link.url)
        const hasUrl = Boolean(link.url)
        const isLive = Boolean(section.host)

        return (
          <Card
            key={section.key}
            className="flex flex-col justify-between border-border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <CardContent className="p-0">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Video className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-foreground">
                      {section.title}
                    </h4>
                    {isLive && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-emerald-500/15 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        Live
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span>Meeting ID: {meetingId}</span>
                    <span className="mx-1">&middot;</span>
                    <span>Passcode: {section.passcode}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    Host: {section.host ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={!hasUrl}
                onClick={() => handleCopyLink(link.url, section.title)}
              >
                <Copy className="size-3.5" aria-hidden="true" />
                Copy Link
              </Button>
              {hasUrl ? (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="h-8 gap-1.5 text-xs"
                >
                  <a
                    href={link.url!}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Join Now
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  className="h-8 text-xs"
                >
                  Not Scheduled
                </Button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}