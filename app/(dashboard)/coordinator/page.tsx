import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function CoordinatorDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Users className="size-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Coordinator Dashboard</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timezone Scoped Oversight</CardTitle>
          <CardDescription>
            View and manage devotion & altar schedules across your assigned timezone(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coordinator dashboard content coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
