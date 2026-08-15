"use client"

import { useState } from "react"
import { SlidersHorizontal, UserPlus, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function AdminSlotOverride() {
  const [slotId, setSlotId] = useState("")
  const [userId, setUserId] = useState("")
  const [reason, setReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAssign = async () => {
    if (!slotId || !userId) {
      toast.error("Slot ID and User ID are required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/slots/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          userId,
          notes: reason || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Slot assigned successfully")
        setSlotId("")
        setUserId("")
        setReason("")
      } else {
        toast.error(data.error?.message || "Failed to assign slot")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleForceCancel = async () => {
    if (!slotId) {
      toast.error("Slot ID is required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/slots/admin-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          reason: reason || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Slot cancelled successfully")
        setSlotId("")
        setReason("")
      } else {
        toast.error(data.error?.message || "Failed to cancel slot")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <SlidersHorizontal
              className="size-4 text-primary"
              aria-hidden="true"
            />
          </div>
          Slot Override
        </CardTitle>
        <CardDescription>Assign or force-cancel slots by ID.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ov-slot">Slot ID</Label>
          <Input
            id="ov-slot"
            placeholder="ObjectId..."
            value={slotId}
            onChange={(e) => setSlotId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ov-user">
            Target User ID{" "}
            <span className="text-muted-foreground">(for assignment)</span>
          </Label>
          <Input
            id="ov-user"
            placeholder="User ID..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ov-reason">
            Notes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="ov-reason"
            placeholder="Optional context..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button onClick={handleAssign} disabled={isSaving} className="flex-1">
            <UserPlus className="size-4" aria-hidden="true" />
            Force Assign
          </Button>
          <Button
            onClick={handleForceCancel}
            disabled={isSaving}
            variant="outline"
            className="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="size-4" aria-hidden="true" />
            Force Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
