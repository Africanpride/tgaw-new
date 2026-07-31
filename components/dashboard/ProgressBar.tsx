import { cn } from "@/lib/utils";

interface ProgressBarProps {
	value: number;
	max?: number;
	className?: string;
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
	const percent = Math.min(100, Math.round((value / max) * 100));

	return (
		<div
			className={cn(
				"h-2 w-full overflow-hidden rounded-full bg-secondary",
				className,
			)}
		>
			<div
				className="h-full rounded-full bg-primary transition-all"
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}
