"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
	BookMarked,
	BookOpen,
	Calendar,
	Clock,
	FileText,
	Flame,
	Loader2,
	Music,
	Sparkles,
	Timer,
	Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	createEventSchema,
	type CreateEventInput,
} from "@/lib/schemas/eventSchema";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
	{
		id: "BIBLE" as const,
		label: "Bible Reading",
		description: "Scripture study & plan",
		icon: BookOpen,
		color: "text-purple-500",
		bg: "bg-purple-500/10",
		border: "border-purple-500/30",
		btnBg: "bg-purple-600 hover:bg-purple-700 text-white",
	},
	{
		id: "PRAYER" as const,
		label: "Prayer Watch",
		description: "Intercession & watch",
		icon: Flame,
		color: "text-red-500",
		bg: "bg-red-500/10",
		border: "border-red-500/30",
		btnBg: "bg-red-600 hover:bg-red-700 text-white",
	},
	{
		id: "PRAISE_WORSHIP" as const,
		label: "Praise & Worship",
		description: "Music & adoration",
		icon: Music,
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		border: "border-amber-500/30",
		btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
	},
];

export function EventFormDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		control,
		setValue,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CreateEventInput>({
		resolver: zodResolver(createEventSchema),
		defaultValues: {
			type: "BIBLE",
			title: "",
			passage: "",
			date: new Date().toISOString().split("T")[0],
			time: "09:00",
			duration: 30,
			zoomUrl: "",
			notes: "",
		},
	});

	const type = useWatch({ control, name: "type" }) ?? "BIBLE";
	const currentTypeConfig = EVENT_TYPES.find((t) => t.id === type) ?? EVENT_TYPES[0];
	const TypeIcon = currentTypeConfig.icon;

	async function onSubmit(values: CreateEventInput) {
		try {
			const res = await fetch("/api/v1/events", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				toast.error("Could not create event");
				return;
			}
			toast.success("Event created successfully");
			onOpenChange(false);
			reset();
			router.refresh();
		} catch (error) {
			console.error(
				"[ERROR] Failed to create event:",
				error instanceof Error ? error.message : String(error),
			);
			toast.error("Could not create event");
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg max-h-[88vh] overflow-hidden p-0 gap-0 border-border/60 shadow-2xl flex flex-col">
				{/* Category-Accented Header */}
				<DialogHeader className={cn("px-5 py-3.5 shrink-0 transition-colors border-b border-border/40", currentTypeConfig.bg)}>
					<div className="flex items-center gap-3">
						<div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background shadow-xs", currentTypeConfig.border)}>
							<TypeIcon className={cn("size-4.5", currentTypeConfig.color)} aria-hidden="true" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold tracking-tight">Add New Event</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground">
								Schedule a new altar session or watch gathering
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-5 overflow-y-auto max-h-[calc(88vh-70px)]">
					{/* 3-Way Card Type Selector */}
					<div className="space-y-1.5">
						<Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							Event Category
						</Label>
						<div className="grid grid-cols-3 gap-2">
							{EVENT_TYPES.map((t) => {
								const isSelected = type === t.id;
								const CardIcon = t.icon;
								return (
									<button
										key={t.id}
										type="button"
										onClick={() => setValue("type", t.id, { shouldValidate: true })}
										className={cn(
											"flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
											isSelected
												? cn("border-2 shadow-2xs bg-background font-semibold", t.border)
												: "border-border/60 bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
										)}
									>
										<CardIcon className={cn("size-4 shrink-0", isSelected ? t.color : "text-muted-foreground")} aria-hidden="true" />
										<span className="text-xs truncate">{t.label}</span>
									</button>
								);
							})}
						</div>
						{errors.type && (
							<p className="text-xs text-destructive">{errors.type.message}</p>
						)}
					</div>

					{/* Title */}
					<div className="space-y-1">
						<Label htmlFor="event-title" className="text-xs font-medium">Title</Label>
						<div className="relative">
							<Sparkles className="absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
							<Input
								id="event-title"
								placeholder="e.g., Morning Prayer Watch"
								className="pl-9 h-9 text-xs"
								{...register("title")}
							/>
						</div>
						{errors.title && (
							<p className="text-xs text-destructive">{errors.title.message}</p>
						)}
					</div>

					{/* Date, Time & Duration 3-Col Grid */}
					<div className="grid grid-cols-3 gap-2">
						<div className="space-y-1">
							<Label htmlFor="event-date" className="text-xs font-medium">Date</Label>
							<div className="relative">
								<Calendar className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
								<Input id="event-date" type="date" className="pl-8 h-9 text-xs" {...register("date")} />
							</div>
							{errors.date && (
								<p className="text-[11px] text-destructive">{errors.date.message}</p>
							)}
						</div>
						<div className="space-y-1">
							<Label htmlFor="event-time" className="text-xs font-medium">Time</Label>
							<div className="relative">
								<Clock className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
								<Input id="event-time" type="time" className="pl-8 h-9 text-xs" {...register("time")} />
							</div>
							{errors.time && (
								<p className="text-[11px] text-destructive">{errors.time.message}</p>
							)}
						</div>
						<div className="space-y-1">
							<Label htmlFor="event-duration" className="text-xs font-medium">Duration (min)</Label>
							<div className="relative">
								<Timer className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
								<Input
									id="event-duration"
									type="number"
									min={1}
									className="pl-8 h-9 text-xs"
									{...register("duration", { valueAsNumber: true })}
								/>
							</div>
							{errors.duration && (
								<p className="text-[11px] text-destructive">{errors.duration.message}</p>
							)}
						</div>
					</div>

					{/* Passage & Meeting URL 2-Col Grid */}
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<Label htmlFor="event-passage" className="text-xs font-medium">Passage / Focus</Label>
							<div className="relative">
								<BookMarked className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
								<Input
									id="event-passage"
									placeholder="Scripture or topic"
									className="pl-8 h-9 text-xs"
									{...register("passage")}
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor="event-zoom-url" className="text-xs font-medium">Meeting URL</Label>
							<div className="relative">
								<Video className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
								<Input
									id="event-zoom-url"
									type="url"
									placeholder="https://zoom.us/j/..."
									className="pl-8 h-9 text-xs"
									{...register("zoomUrl")}
								/>
							</div>
							{errors.zoomUrl && (
								<p className="text-[11px] text-destructive">{errors.zoomUrl.message}</p>
							)}
						</div>
					</div>

					{/* Notes */}
					<div className="space-y-1">
						<Label htmlFor="event-notes" className="text-xs font-medium">Notes</Label>
						<Textarea
							id="event-notes"
							placeholder="Add session notes or guidelines..."
							rows={2}
							className="resize-none text-xs min-h-[50px]"
							{...register("notes")}
						/>
					</div>

					{/* Footer Actions */}
					<div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" size="sm" disabled={isSubmitting} className={cn("gap-1.5 font-medium shadow-2xs transition-all h-9 px-4 text-xs", currentTypeConfig.btnBg)}>
							{isSubmitting ? (
								<>
									<Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
									Creating...
								</>
							) : (
								"Create Event"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}