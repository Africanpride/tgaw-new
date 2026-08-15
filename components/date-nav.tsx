"use client";

import { addDays, format, parse } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DateNav({
	dateStr,
	basePath = "/bible",
}: {
	dateStr: string;
	basePath?: string;
}) {
	const current = parse(dateStr, "yyyy-MM-dd", new Date());
	const prev = format(addDays(current, -1), "yyyy-MM-dd");
	const next = format(addDays(current, 1), "yyyy-MM-dd");
	const label = format(current, "EEE, MMM d");

	return (
		<div className="flex items-center gap-2">
			<Button variant="outline" size="sm" asChild>
				<Link href={`${basePath}?date=${prev}`} aria-label="Previous day">
					<ChevronLeft className="size-4" aria-hidden="true" />
				</Link>
			</Button>
			<span className="min-w-[120px] text-center text-sm font-medium">
				{label}
			</span>
			<Button variant="outline" size="sm" asChild>
				<Link href={`${basePath}?date=${next}`} aria-label="Next day">
					<ChevronRight className="size-4" aria-hidden="true" />
				</Link>
			</Button>
		</div>
	);
}
