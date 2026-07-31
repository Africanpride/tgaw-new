"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    items?: {
      title: string
      url: string
      minRole?: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const isOverview = item.title === "Overview" && !hasSubItems

          if (isOverview) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} className="cursor-pointer" />}
                  isActive={pathname === item.url}
                  tooltip={item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.items?.some((sub) => pathname === sub.url)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton tooltip={item.title} />
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={
                            <Link href={subItem.url} className="cursor-pointer" />
                          }
                          isActive={pathname === subItem.url}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
