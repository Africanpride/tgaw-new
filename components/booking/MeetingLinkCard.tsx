"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Video } from "lucide-react";
import { toast } from "sonner";

interface MeetingLinkCardProps {
  url: string;
  label: string | null;
}

export function MeetingLinkCard({ url, label }: MeetingLinkCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Video className="size-4" aria-hidden="true" />
          </span>
          <span className="flex-1 truncate">{label || "Meeting Link"}</span>
          <Badge variant="secondary" className="shrink-0">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="default" className="flex-1" onClick={() => window.open(url, "_blank")}>
            Join Meeting
          </Button>
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
            <Copy className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}