"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
            className="gap-2"
          >
            {[
              { value: "1", title: "1. Full Public", desc: "Everyone sees who booked every slot." },
              { value: "2", title: "2. Count Only", desc: "Hide names, show only \"Booked\"." },
              { value: "3", title: "3. Full Transparency", desc: "Show names + prominent empty slots." },
              { value: "4", title: "4. Role-Scoped (Default)", desc: "Leaders see names, members only see availability." },
            ].map((mode) => {
              const selected = config.visibilityMode.toString() === mode.value;
              return (
                <label
                  key={mode.value}
                  htmlFor={`mode${mode.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem value={mode.value} id={`mode${mode.value}`} className="mt-0.5" />
                  <div className="flex-1">
                    <span className={cn("text-sm", selected ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                      {mode.title}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
                  </div>
                  {selected && (
                    <Check className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                  )}
                </label>
              );
            })}
          </RadioGroup>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}
