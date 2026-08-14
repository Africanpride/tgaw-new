"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventType } from "@prisma/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminMeetingLinkManager() {
  const [type, setType] = useState<EventType>("BIBLE");
  const [date, setDate] = useState<Date>(new Date());
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; date: string } | null>(null);

  const handleSave = async () => {
    if (!url) {
      toast.error("URL is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/slots/meeting-link", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date: format(date, "yyyy-MM-dd"),
          url,
          label: label || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Meeting link saved successfully");
        setUrl("");
        setLabel("");
      } else {
        toast.error(data.error?.message || "Failed to save meeting link");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setDeleteTarget({
      type,
      date: format(date, "yyyy-MM-dd"),
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/v1/slots/meeting-link?type=${deleteTarget.type}&date=${deleteTarget.date}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Meeting link deleted");
      } else {
        toast.error(data.error?.message || "Failed to delete meeting link");
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
        <CardTitle>Meeting Link Manager</CardTitle>
        <CardDescription>Manage Zoom/Teams links for specific types and dates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIBLE">Bible Reading</SelectItem>
                  <SelectItem value="PRAYER">Prayer</SelectItem>
                  <SelectItem value="PRAISE_WORSHIP">Praise & Worship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="border rounded-md inline-block">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meeting URL</Label>
              <Input 
                type="url" 
                placeholder="https://zoom.us/..." 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Label (Optional)</Label>
              <Input 
                placeholder="e.g. Morning Prayer Room" 
                value={label} 
                onChange={(e) => setLabel(e.target.value)} 
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? "Saving..." : "Save Link"}
              </Button>
              <Button onClick={handleDelete} disabled={isSaving} variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete meeting link?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the meeting link for {deleteTarget?.type.replace("_", " ").toLowerCase()}{" "}
              on {deleteTarget?.date}. Booked slots are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep link</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
