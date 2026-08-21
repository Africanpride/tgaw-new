"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Video } from "lucide-react";
import { toast } from "sonner";

interface MeetingLinkCardProps {
	url: string;
	label: string | null;
	/** Present only while a session of this type is live right now. */
	hostName?: string | null;
}

export function MeetingLinkCard({ url, label, hostName }: MeetingLinkCardProps) {
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Could not copy the link");
		}
	};

	const isLive = !!hostName;

	return (
		<Card className="bg-primary/5 border-primary/20">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
						<Video className="size-4" aria-hidden="true" />
					</span>
					<span className="flex-1 truncate">{label || "Meeting Link"}</span>
					{isLive && (
						<Badge variant="default" className="shrink-0 gap-1">
							<span className="relative flex size-1.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
								<span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
							</span>
							Live
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{isLive && (
					<p className="text-xs text-muted-foreground">Hosted by {hostName}</p>
				)}
				<div className="flex gap-2">
					<Button className="flex-1 cursor-pointer" asChild>
						<a href={url} target="_blank" rel="noreferrer">
							Join Meeting
						</a>
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="cursor-pointer"
						onClick={handleCopy}
						aria-label="Copy link"
					>
						<Copy className="size-4" aria-hidden="true" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
