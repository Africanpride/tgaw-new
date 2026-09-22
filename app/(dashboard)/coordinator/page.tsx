import { Users, Clock } from "lucide-react"
import { cookies, headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { EmptyState } from "@/components/EmptyState"
import { getServerTranslation } from "@/lib/notifications/locale"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/i18n/config"
import { CoordinatorStats } from "@/components/coordinator/CoordinatorStats"

export default async function CoordinatorDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const role = (session.user as { role?: string } | undefined)?.role
  const isSuperadmin = role === "superadmin"

  const assignments = await prisma.coordinatorAssignment.findMany({
    where: { userId: session.user.id },
  })
  let timezones = assignments.map((a) => a.timezone)

  // Superadmins without explicit coordinator assignments see all global timezones
  if (timezones.length === 0 && isSuperadmin) {
    const allProfiles = await prisma.userProfile.findMany({
      select: { timezone: true },
      where: { timezone: { not: "" } },
    })
    timezones = [...new Set(allProfiles.map((p) => p.timezone).filter(Boolean))]
  }

  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE
  const L = (key: string) => getServerTranslation(locale, "admin", key)

  const [pageTitle, emptyCardTitle, emptyCardDesc, emptyTitle, emptyDesc] =
    await Promise.all([
      L("coordinator.title"),
      L("coordinator.emptyCardTitle"),
      L("coordinator.emptyCardDesc"),
      L("coordinator.emptyTitle"),
      L("coordinator.emptyDesc"),
    ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Users className="size-6 text-primary" aria-hidden={true} />
        <h2 className="text-2xl tracking-tight">{pageTitle}</h2>
      </div>

      {timezones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{emptyCardTitle}</CardTitle>
            <CardDescription>{emptyCardDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={Clock} title={emptyTitle} description={emptyDesc} />
          </CardContent>
        </Card>
      ) : (
        <CoordinatorStats timezones={timezones} />
      )}
    </div>
  )
}
