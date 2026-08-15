"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	createEventSchema,
	type CreateEventInput,
} from "@/lib/schemas/eventSchema";

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

	const type = useWatch({ control, name: "type" });

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
			toast.success("Event created");
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
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add New Event</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="event-type">Type</Label>
						<Select
							value={type}
							onValueChange={(v) =>
								setValue("type", v as CreateEventInput["type"], {
									shouldValidate: true,
								})
							}
						>
							<SelectTrigger id="event-type">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="BIBLE">Bible Reading</SelectItem>
								<SelectItem value="PRAYER">Prayer</SelectItem>
								<SelectItem value="PRAISE_WORSHIP">
									Praise & Worship
								</SelectItem>
							</SelectContent>
						</Select>
						{errors.type && (
							<p className="text-xs text-destructive">
								{errors.type.message}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-title">Title</Label>
						<Input
							id="event-title"
							placeholder="Event title"
							{...register("title")}
						/>
						{errors.title && (
							<p className="text-xs text-destructive">
								{errors.title.message}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="event-date">Date</Label>
							<Input id="event-date" type="date" {...register("date")} />
							{errors.date && (
								<p className="text-xs text-destructive">
									{errors.date.message}
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="event-time">Time</Label>
							<Input id="event-time" type="time" {...register("time")} />
							{errors.time && (
								<p className="text-xs text-destructive">
									{errors.time.message}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-duration">Duration (minutes)</Label>
						<Input
							id="event-duration"
							type="number"
							min={1}
							{...register("duration", { valueAsNumber: true })}
						/>
						{errors.duration && (
							<p className="text-xs text-destructive">
								{errors.duration.message}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-passage">Passage / focus</Label>
						<Input
							id="event-passage"
							placeholder="Optional bible passage or prayer focus"
							{...register("passage")}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-zoom-url">Zoom / Teams URL</Label>
						<Input
							id="event-zoom-url"
							type="url"
							placeholder="https://..."
							{...register("zoomUrl")}
						/>
						{errors.zoomUrl && (
							<p className="text-xs text-destructive">
								{errors.zoomUrl.message}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-notes">Notes</Label>
						<Textarea
							id="event-notes"
							placeholder="Optional notes"
							rows={3}
							{...register("notes")}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							Save Event
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}