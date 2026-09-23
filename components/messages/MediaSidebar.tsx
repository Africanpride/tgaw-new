"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon, Film, Music } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/hooks/useMessages";

interface MediaSidebarProps {
	messages: ChatMessage[];
	className?: string;
}

function getMediaType(url: string): "image" | "video" | "audio" | "file" {
	if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(url)) return "image";
	if (/\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url)) return "video";
	if (/\.(mp3|wav|ogg|flac|aac|m4a)(\?|$)/i.test(url)) return "audio";
	return "file";
}

function getFileName(url: string): string {
	const parts = url.split("/");
	const last = parts[parts.length - 1] ?? url;
	return decodeURIComponent(last.split("?")[0] ?? last);
}

const MEDIA_ICON_MAP = {
	image: ImageIcon,
	video: Film,
	audio: Music,
	file: FileText,
} as const;

export function MediaSidebar({ messages, className }: MediaSidebarProps) {
	const mediaItems = useMemo(() => {
		const seen = new Set<string>();
		const items: { url: string; type: "image" | "video" | "audio" | "file"; name: string }[] = [];
		for (const msg of messages) {
			if (msg.attachmentUrl && !seen.has(msg.attachmentUrl)) {
				seen.add(msg.attachmentUrl);
				items.push({
					url: msg.attachmentUrl,
					type: getMediaType(msg.attachmentUrl),
					name: getFileName(msg.attachmentUrl),
				});
			}
		}
		return items;
	}, [messages]);

	const images = mediaItems.filter((i) => i.type === "image");
	const attachments = mediaItems.filter((i) => i.type !== "image");

	if (mediaItems.length === 0) return null;

	return (
		<div className={cn("flex h-full flex-col", className)}>
			{/* Media section */}
			{images.length > 0 && (
				<div className="px-4 pt-4">
					<h6 className="text-sm font-medium text-foreground">
						Media ({images.length})
					</h6>
					<div className="mt-3 grid grid-cols-3 gap-1.5">
						{images.map((item) => (
							<div
									key={item.url}
									className="group/media relative aspect-square cursor-pointer overflow-hidden rounded-md bg-muted"
								>
									<Image
										src={item.url}
										alt={item.name}
										fill
										sizes="120px"
										className="object-cover transition-transform group-hover/media:scale-105"
										loading="lazy"
									/>
								</div>
						))}
					</div>
				</div>
			)}

			{/* Attachments section */}
			{attachments.length > 0 && (
				<div className="mt-6 px-4">
					<h6 className="text-sm font-medium text-foreground">
						Attachments ({attachments.length})
					</h6>
					<ScrollArea className="mt-3 max-h-75">
						<div className="space-y-2">
							{attachments.map((item) => {
								const Icon = MEDIA_ICON_MAP[item.type];
								return (
									<a
										key={item.url}
										href={item.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 rounded-md border border-border/30 bg-background p-2.5 transition-colors hover:bg-muted/50"
									>
										<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
											<Icon className="size-4 text-muted-foreground" aria-hidden="true" />
										</div>
										<p className="min-w-0 truncate text-xs font-medium text-foreground">
											{item.name}
										</p>
									</a>
								);
							})}
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	);
}
