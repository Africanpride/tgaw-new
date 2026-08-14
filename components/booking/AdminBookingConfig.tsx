"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminBookingConfig({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig || {
    maxBibleSlotsPerDay: 2,
    maxPrayerSlotsPerDay: 2,
    maxWorshipSlotsPerDay: 2,
    visibilityMode: 4
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/slots/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxBibleSlotsPerDay: Number(config.maxBibleSlotsPerDay),
          maxPrayerSlotsPerDay: Number(config.maxPrayerSlotsPerDay),
          maxWorshipSlotsPerDay: Number(config.maxWorshipSlotsPerDay),
          visibilityMode: Number(config.visibilityMode),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configuration updated successfully");
        router.refresh();
      } else {
        toast.error(data.error?.message || "Failed to update configuration");
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
        <CardTitle>Booking Configuration</CardTitle>
        <CardDescription>Set global limits and visibility modes for all users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Daily Limits (Slots per user)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxBible">Bible</Label>
              <Input 
                id="maxBible" 
                type="number" 
                value={config.maxBibleSlotsPerDay} 
                onChange={(e) => setConfig({ ...config, maxBibleSlotsPerDay: e.target.value })} 
                min={0} max={48} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPrayer">Prayer</Label>
              <Input 
                id="maxPrayer" 
                type="number" 
                value={config.maxPrayerSlotsPerDay} 
                onChange={(e) => setConfig({ ...config, maxPrayerSlotsPerDay: e.target.value })} 
                min={0} max={48} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWorship">Worship</Label>
              <Input 
                id="maxWorship" 
                type="number" 
                value={config.maxWorshipSlotsPerDay} 
                onChange={(e) => setConfig({ ...config, maxWorshipSlotsPerDay: e.target.value })} 
                min={0} max={48} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm">Visibility Mode</h3>
          <RadioGroup 
            value={config.visibilityMode.toString()} 
            onValueChange={(v) => setConfig({ ...config, visibilityMode: Number(v) })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="mode1" />
              <Label htmlFor="mode1" className="font-normal">
                <span className="font-medium">1. Full Public</span> - Everyone sees who booked every slot.
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="mode2" />
              <Label htmlFor="mode2" className="font-normal">
                <span className="font-medium">2. Count Only</span> - Hide names, show only "Booked".
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="mode3" />
              <Label htmlFor="mode3" className="font-normal">
                <span className="font-medium">3. Full Transparency</span> - Show names + prominent empty slots.
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="4" id="mode4" />
              <Label htmlFor="mode4" className="font-normal">
                <span className="font-medium">4. Role-Scoped (Default)</span> - Leaders see names, members only see availability.
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}
