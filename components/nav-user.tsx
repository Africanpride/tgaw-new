"use client"

import {
  Book,
  Church,
  Cookie,
  Globe,
  LogOut,
  Music,
  Settings,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { UserAvatar } from "@/components/UserAvatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import { signOut, useSession } from "@/lib/auth-client"
import { useConsent } from "@/components/consent/ConsentProvider"
import { cn } from "@/lib/utils"

interface ZoomSessionLink {
  id: string
  labelKey: string
  url: string
  isActive: boolean
  customLabel?: string | null
}

const DEFAULT_ZOOM_LINKS: ZoomSessionLink[] = [
  {
    id: "bible",
    labelKey: "sidebar.bible",
    url: "https://zoom.us/j/89234156701",
    isActive: false,
  },
  {
    id: "prayer",
    labelKey: "usermenu.session.prayer",
    url: "https://zoom.us/j/89234156702",
    isActive: false,
  },
  {
    id: "worship",
    labelKey: "sidebar.worship",
    url: "https://zoom.us/j/89234156703",
    isActive: false,
  },
]

const CHANNEL_META: Record<
  string,
  { icon: typeof Book; tint: string; dot: string }
> = {
  bible: {
    icon: Book,
    tint: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  prayer: {
    icon: Church,
    tint: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500",
  },
  worship: {
    icon: Music,
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
}

function isCurrentSlot(slot: { startTime: string; endTime: string }): boolean {
  const now = new Date()
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  return (
    toMin(slot.startTime) <= nowMin &&
    nowMin < toMin(slot.endTime === "24:00" ? "24:00" : slot.endTime)
  )
}

interface NavUserProps {
  zoomLinks?: ZoomSessionLink[]
}

export function NavUser({
  zoomLinks: initialLinks = DEFAULT_ZOOM_LINKS,
}: NavUserProps) {
  const { t } = useTranslation("dashboard")
  const { data: session } = useSession()
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { openCustomize } = useConsent()
  const [zoomLinks, setZoomLinks] = useState<ZoomSessionLink[]>(initialLinks)

  useEffect(() => {
    let cancelled = false
    async function loadLive() {
      try {
        const today = new Date().toISOString().split("T")[0]
        const res = await fetch(`/api/v1/slots?date=${today}`)
        if (!res.ok) return
        const json = await res.json()
        if (!json.success || !json.data?.slots) return
        const slots: {
          type: string
          startTime: string
          endTime: string
          date: string
        }[] = json.data.slots
        const linksMap: Record<string, { url: string; label?: string | null }> =
          {}
        const ml = json.data.meetingLinks as
          | Record<string, { url: string; label?: string | null } | null>
          | undefined
        if (ml) {
          if (ml.BIBLE?.url)
            linksMap.bible = { url: ml.BIBLE.url, label: ml.BIBLE.label }
          if (ml.PRAYER?.url)
            linksMap.prayer = { url: ml.PRAYER.url, label: ml.PRAYER.label }
          if (ml.PRAISE_WORSHIP?.url)
            linksMap.worship = {
              url: ml.PRAISE_WORSHIP.url,
              label: ml.PRAISE_WORSHIP.label,
            }
        }
        const byType: Record<string, typeof slots> = {
          bible: [],
          prayer: [],
          worship: [],
        }
        for (const s of slots) {
          const key =
            s.type === "BIBLE"
              ? "bible"
              : s.type === "PRAYER"
                ? "prayer"
                : "worship"
          byType[key].push(s)
        }
        if (cancelled) return
        setZoomLinks((prev) =>
          prev.map((link) => {
            const typeSlots = byType[link.id] ?? []
            const live = typeSlots.some((s) => isCurrentSlot(s))
            const realUrl = linksMap[link.id]?.url
            return {
              ...link,
              isActive: live,
              url: realUrl || link.url,
              customLabel: linksMap[link.id]?.label ?? null,
            }
          })
        )
      } catch {
        // keep defaults
      }
    }
    loadLive()
    const id = setInterval(loadLive, 60000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const user = session?.user
  const name = user?.name ?? t("usermenu.guest")
  const email = user?.email ?? ""
  const role = (user?.role as string) ?? "member"
  const roleLabel = t(`usermenu.role.${role}`, { defaultValue: role })

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <UserAvatar name={user?.name} image={user?.image} className="size-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <UserAvatar
                name={user?.name}
                image={user?.image}
                className="size-8"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                    {roleLabel}
                  </span>
                  <span className="truncate">{email}</span>
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {zoomLinks.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="tracking-wide uppercase">
              {t("usermenu.liveMeetings")}
            </DropdownMenuLabel>
            {zoomLinks.map((link) => {
              const meta = CHANNEL_META[link.id]
              const Icon = meta?.icon ?? Video
              const activeTint = meta?.dot ?? "bg-emerald-500"
              const displayLabel = link.customLabel
                ? `${t(link.labelKey)} · ${link.customLabel}`
                : t(link.labelKey)
              return (
                <DropdownMenuItem
                  key={link.id}
                  asChild
                  className={cn(
                    "cursor-pointer gap-2",
                    link.isActive && "bg-emerald-500/5"
                  )}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="cursor-pointer"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border text-[10px]",
                        meta?.tint ?? "bg-muted"
                      )}
                    >
                      <Icon className="size-3" aria-hidden="true" />
                    </span>
                    <span className="flex-1 truncate text-sm">{displayLabel}</span>
                    {link.isActive ? (
                      <span className="ml-auto inline-flex items-center gap-1.5">
                        <span className="hidden text-[10px] font-medium text-emerald-700 sm:inline dark:text-emerald-400">
                          {t("usermenu.live")}
                        </span>
                        <span className="relative flex size-2" aria-hidden="true">
                          <span
                            className={cn(
                              "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                              activeTint
                            )}
                          />
                          <span
                            className={cn(
                              "relative inline-flex size-2 rounded-full",
                              activeTint
                            )}
                          />
                        </span>
                      </span>
                    ) : (
                      <Video
                        className="ml-auto size-3 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </a>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <Settings />
            {t("usermenu.mySettings")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => openCustomize()}
          >
            <Cookie />
            {t("usermenu.cookiePreferences")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" className="cursor-pointer">
            <Globe />
            {t("usermenu.backToWebsite")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut />
          {t("usermenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}