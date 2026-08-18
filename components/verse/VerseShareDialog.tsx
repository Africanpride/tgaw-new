"use client"

import { Copy, Globe, Hash, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { LucideIcon } from "lucide-react"
import type { Verse } from "@/lib/data/verses"

interface VerseShareDialogProps {
  verse: Verse
}

interface ShareOption {
  label: string
  icon: LucideIcon
  href: (url: string, text: string) => string
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    label: "WhatsApp",
    icon: MessageCircle,
    href: (_url, text) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    label: "Facebook",
    icon: Globe,
    href: (url, text) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    label: "X (Twitter)",
    icon: Hash,
    href: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: "Telegram",
    icon: Send,
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
]

export function VerseShareDialog({ verse }: VerseShareDialogProps) {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verse/today`
  const shareText = `"${verse.text}" — ${verse.reference}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
    toast.success("Verse copied to clipboard")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="size-4" aria-hidden="true" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share this verse</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {SHARE_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              className="justify-start gap-3"
              asChild
            >
              <a
                href={option.href(shareUrl, shareText)}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer"
              >
                <option.icon className="size-4" aria-hidden="true" />
                {option.label}
              </a>
            </Button>
          ))}
          <Button variant="ghost" className="justify-start gap-3" onClick={handleCopy}>
            <Copy className="size-4" aria-hidden="true" />
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
