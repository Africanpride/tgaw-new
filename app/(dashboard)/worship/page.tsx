"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Church } from "lucide-react"

export default function WorshipPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="size-5" />
            Praise &amp; Worship
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Coming Soon</p>
          <p className="text-center text-sm text-muted-foreground max-w-md">
            The Praise &amp; Worship dashboard will help you track worship sessions,
            share praise reports, and join community worship events.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
