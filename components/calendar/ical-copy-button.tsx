"use client";

import { useState } from "react";
import { Check, Copy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function IcalCopyButton({ token, baseUrl }: { token: string; baseUrl?: string }) {
	const [copied, setCopied] = useState(false);
	const url = `${baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "")}/api/v1/calendar/ical?token=${token}`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success("iCal link copied");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy");
		}
	};

	return (
		<div className="flex items-center gap-2 rounded-lg border bg-card p-2 sm:p-3">
			<Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<input
				readOnly
				value={url}
				className="min-w-0 flex-1 truncate bg-transparent text-xs outline-none"
				aria-label="iCal feed URL"
				onFocus={(e) => e.target.select()}
			/>
			<Button size="sm" variant="outline" className="cursor-pointer" onClick={handleCopy} aria-label="Copy iCal link">
				{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
				{copied ? "Copied" : "Copy"}
			</Button>
		</div>
	);
}