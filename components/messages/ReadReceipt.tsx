"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface ReadReceiptProps {
	status: "sent" | "delivered" | "read";
	className?: string;
}

export function ReadReceipt({ status, className }: ReadReceiptProps) {
	if (status === "sent") {
		return (
			<Check
				className={cn("size-3.5 text-primary-foreground/50", className)}
				aria-hidden="true"
			/>
		);
	}

	return (
		<CheckCheck
			className={cn(
				"size-3.5",
				status === "read" ? "text-blue-400" : "text-primary-foreground/50",
				className,
			)}
			aria-hidden="true"
		/>
	);
}
