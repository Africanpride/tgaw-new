"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SlotData } from "./SlotCell";

export function AdminSlotOverride() {
  const [slotId, setSlotId] = useState("");
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAssign = async () => {
    if (!slotId || !userId) {
      toast.error("Slot ID and User ID are required");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/slots/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          userId,
          notes: reason || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Slot assigned successfully");
        setSlotId("");
        setUserId("");
        setReason("");
      } else {
        toast.error(data.error?.message || "Failed to assign slot");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceCancel = async () => {
    if (!slotId) {
      toast.error("Slot ID is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/slots/admin-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          reason: reason || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Slot cancelled successfully");
        setSlotId("");
        setReason("");
      } else {
        toast.error(data.error?.message || "Failed to cancel slot");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slot Override</CardTitle>
        <CardDescription>Directly assign or force-cancel slots by ID.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Slot ID</Label>
          <Input 
            placeholder="ObjectId..." 
            value={slotId} 
            onChange={(e) => setSlotId(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Target User ID (for assignment)</Label>
          <Input 
            placeholder="User ID..." 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Notes / Reason</Label>
          <Input 
            placeholder="Optional context..." 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleAssign} disabled={isSaving} className="flex-1">
            Force Assign
          </Button>
          <Button onClick={handleForceCancel} disabled={isSaving} variant="destructive">
            Force Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
