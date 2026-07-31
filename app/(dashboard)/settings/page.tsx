"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Coming Soon</p>
          <p className="text-center text-sm text-muted-foreground max-w-md">
            Manage your profile, notification preferences, and security settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
