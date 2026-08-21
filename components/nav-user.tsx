"use client"

import { Globe, LogOut, Settings, Video } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { cn } from "@/lib/utils"

interface ZoomSessionLink {
  id: string
  label: string
  url: string
  isActive: boolean
}

const DEFAULT_ZOOM_LINKS: ZoomSessionLink[] = [
  {
    id: "bible",
    label: "Bible Reading",
    url: "https://zoom.us/j/89234156701",
    isActive: true,
  },
  {
    id: "prayer",
    label: "Morning Intercession",
    url: "https://zoom.us/j/89234156702",
    isActive: true,
  },
  {
    id: "worship",
    label: "Praise & Worship",
    url: "https://zoom.us/j/89234156703",
    isActive: false,
  },
]

interface NavUserProps {
  zoomLinks?: ZoomSessionLink[]
}

export function NavUser({ zoomLinks = DEFAULT_ZOOM_LINKS }: NavUserProps) {
  const { data: session } = useSession()
  const { isMobile } = useSidebar()
  const router = useRouter()

  const user = session?.user
  const name = user?.name ?? "User"
  const email = user?.email ?? ""
  const role = (user?.role as string) ?? "member"

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
              <UserAvatar name={user?.name} image={user?.image} className="size-8" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                    {role}
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
            <DropdownMenuLabel className="uppercase tracking-wide">
              Live Meetings
            </DropdownMenuLabel>
            {zoomLinks.map((link) => (
              <DropdownMenuItem
                key={link.id}
                className={cn(
                  "cursor-pointer",
                  link.isActive && "bg-emerald-500/5"
                )}
                render={
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="cursor-pointer"
                  />
                }
              >
                <Video className="size-4" aria-hidden="true" />
                {link.isActive && (
                  <span
                    className="relative flex size-2"
                    aria-hidden="true"
                  >
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/" className="cursor-pointer" />}>
          <Globe />
          Back to Website
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
