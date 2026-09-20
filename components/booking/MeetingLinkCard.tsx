"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Video } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconTile } from "@/components/IconTile"

interface MeetingLinkCardProps {
  url: string
  label: string | null
  /** Present only while a session of this type is live right now. */
  hostName?: string | null
}

export function MeetingLinkCard({
  url,
  label,
  hostName,
}: MeetingLinkCardProps) {
  const { t } = useTranslation("booking");
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("meeting.toastCopied"))
    } catch {
      toast.error(t("meeting.toastCopyFailed"))
    }
  }

  const isLive = !!hostName

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <IconTile icon={Video} size="sm" />
          <span className="flex-1 truncate">{label || t("meeting.fallbackLabel")}</span>
          {isLive && (
            <Badge variant="default" className="shrink-0 gap-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              {t("meeting.live")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLive && (
          <p className="text-xs text-muted-foreground">{t("meeting.hostedBy", { hostName })}</p>
        )}
        <div className="flex gap-2">
          <Button className="flex-1 cursor-pointer" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              {t("meeting.joinMeeting")}
            </a>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            onClick={handleCopy}
            aria-label={t("meeting.copyLink")}
          >
            <Copy className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}