import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function BoardDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Shield className="size-6 text-primary" />
        <h2 className="text-2xl tracking-tight">Board Dashboard</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Org-Wide Oversight</CardTitle>
          <CardDescription>
            High-level metrics and aggregate view across all global timezones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Board dashboard content coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
