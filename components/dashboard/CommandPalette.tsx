"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CommandPaletteProps {
  role: string;
}

const NAV: { group: string; items: { label: string; href: string; icon: typeof Calendar }[] }[] = [
  {
    group: "Devotion",
    items: [
      { label: "Dashboard", href: "/overview", icon: LayoutDashboard },
      { label: "Slot Booking", href: "/booking", icon: Calendar },
      { label: "Bible Reading", href: "/bible", icon: Calendar },
      { label: "Prayer", href: "/prayer", icon: Calendar },
      { label: "Praise & Worship", href: "/worship", icon: Calendar },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    group: "Community",
    items: [
      { label: "Feed", href: "/feed", icon: MessageSquare },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Groups", href: "/groups", icon: Users },
    ],
  },
  {
    group: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

/** Quick navigation command palette, opened with Cmd/Ctrl+K. */
export function CommandPalette({ role }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isSuper = role === "superadmin";
  const isLeader = isSuper || role === "leader";
  const isCoordinator = isSuper || role === "coordinator";
  const isBoard = isSuper || role === "board";

  const groups = useMemo(() => {
    const g = NAV.map((group) => ({
      ...group,
      items: [...group.items],
    }));
    if (isCoordinator) g.push({ group: "Leadership", items: [{ label: "Coordinator Dashboard", href: "/coordinator", icon: LayoutDashboard }] });
    if (isBoard) g.push({ group: "Leadership", items: [{ label: "Org Dashboard", href: "/board", icon: LayoutDashboard }] });
    if (isLeader) {
      g.push({
        group: "Leadership",
        items: [
          { label: "Admin Portal", href: "/admin", icon: Settings },
          { label: "Moderation Queue", href: "/admin/reports", icon: Settings },
        ],
      });
    }
    if (isSuper) g.push({ group: "Leadership", items: [{ label: "User Management", href: "/admin/users", icon: Users }] });
    return g;
  }, [isSuper, isLeader, isCoordinator, isBoard]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="cursor-pointer"
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}