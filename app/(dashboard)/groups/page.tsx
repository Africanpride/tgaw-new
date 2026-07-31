"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export default function GroupsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">No groups yet</p>
          <p className="text-center text-sm text-muted-foreground max-w-md">
            Create or join groups for Bible study, prayer circles, and community fellowship.
          </p>
          <Button className="cursor-pointer">Create Group</Button>
        </CardContent>
      </Card>
    </div>
  )
}
