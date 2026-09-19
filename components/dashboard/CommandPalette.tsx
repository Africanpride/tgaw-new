"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

/** Quick navigation command palette, opened with Cmd/Ctrl+K. */
export function CommandPalette({ role }: CommandPaletteProps) {
  const { t } = useTranslation("dashboard");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isSuper = role === "superadmin";
  const isLeader = isSuper || role === "leader";
  const isCoordinator = isSuper || role === "coordinator";
  const isBoard = isSuper || role === "board";

  const groups = useMemo(() => {
    const g: { group: string; items: { label: string; href: string; icon: typeof Calendar }[] }[] = [
      {
        group: t("palette.group.devotion"),
        items: [
          { label: t("topbar.page.dashboard"), href: "/overview", icon: LayoutDashboard },
          { label: t("topbar.page.booking"), href: "/booking", icon: Calendar },
          { label: t("sidebar.bible"), href: "/bible", icon: Calendar },
          { label: t("sidebar.prayer"), href: "/prayer", icon: Calendar },
          { label: t("sidebar.worship"), href: "/worship", icon: Calendar },
          { label: t("topbar.page.calendar"), href: "/calendar", icon: Calendar },
        ],
      },
      {
        group: t("palette.group.community"),
        items: [
          { label: t("sidebar.feed"), href: "/feed", icon: MessageSquare },
          { label: t("sidebar.messages"), href: "/messages", icon: MessageSquare },
          { label: t("sidebar.groups"), href: "/groups", icon: Users },
        ],
      },
      {
        group: t("palette.group.account"),
        items: [{ label: t("sidebar.settings"), href: "/settings", icon: Settings }],
      },
    ];
    if (isCoordinator) g.push({ group: t("palette.group.leadership"), items: [{ label: t("sidebar.coordinatorDashboard"), href: "/coordinator", icon: LayoutDashboard }] });
    if (isBoard) g.push({ group: t("palette.group.leadership"), items: [{ label: t("sidebar.orgDashboard"), href: "/board", icon: LayoutDashboard }] });
    if (isLeader) {
      g.push({
        group: t("palette.group.leadership"),
        items: [
          { label: t("sidebar.admin"), href: "/admin", icon: Settings },
          { label: t("topbar.page.reports"), href: "/admin/reports", icon: Settings },
        ],
      });
    }
    if (isSuper) g.push({ group: t("palette.group.leadership"), items: [{ label: t("sidebar.users"), href: "/admin/users", icon: Users }] });
    return g;
  }, [t, isSuper, isLeader, isCoordinator, isBoard]);

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
      <CommandInput placeholder={t("palette.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("palette.empty")}</CommandEmpty>
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