"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";
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
        <CardTitle className="text-sm font-medium flex items-center">
          <ExternalLink className="w-4 h-4 mr-2" />
          {label || "Meeting Link"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="default" className="flex-1" onClick={() => window.open(url, '_blank')}>
            Join Meeting
          </Button>
          <Button variant="outline" size="icon" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
