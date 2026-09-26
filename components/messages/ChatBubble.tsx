"use client";

import { cn } from "@/lib/utils";
import { ReadReceipt } from "./ReadReceipt";
import { MoreHorizontal, Reply, Pencil, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage } from "@/hooks/useMessages";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

interface ChatBubbleProps {
	message: ChatMessage;
	isMine: boolean;
	onReply: (message: ChatMessage) => void;
	onEdit: (message: ChatMessage) => void;
	onDelete: (messageId: string) => void;
	onReact: (messageId: string, emoji: string) => void;
	senderName?: string;
	showSender?: boolean;
}

export function ChatBubble({
	message,
	isMine,
	onReply,
	onEdit,
	onDelete,
	onReact,
	senderName,
	showSender,
}: ChatBubbleProps) {
	if (message.deletedAt) {
		return (
			<div className={cn("group/message flex py-0.5", isMine ? "justify-end" : "justify-start")}>
				<div className="max-w-[80%] lg:max-w-[60%] rounded-xl border border-dashed border-muted-foreground/20 px-3 py-2">
					<p className="text-xs italic text-muted-foreground">This message was deleted</p>
				</div>
			</div>
		);
	}

	const readCount = message.readBy.length;
	const receiptStatus: "sent" | "delivered" | "read" =
		readCount > 1 ? "read" : readCount === 1 ? "delivered" : "sent";

	const reactionGroups = message.reactions.reduce<Record<string, string[]>>((acc, r) => {
		if (!acc[r.emoji]) acc[r.emoji] = [];
		acc[r.emoji].push(r.userId);
		return acc;
	}, {});

	return (
		<div className={cn("group/message flex py-0.5", isMine ? "justify-end" : "justify-start")}>
			<div className={cn("relative max-w-[80%] lg:max-w-[60%]", isMine ? "order-1" : "order-1")}>
				{showSender && senderName && (
					<p className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">
						{senderName}
					</p>
				)}

				{message.replyTo && (
					<div
						className={cn(
							"rounded-t-xl border-l-2 px-3 py-1.5 text-xs",
							isMine
								? "border-l-primary-foreground/40 bg-primary/80 text-primary-foreground/70"
								: "border-l-primary bg-muted/80 text-muted-foreground",
						)}
					>
						<p className="truncate font-medium">{message.replyTo.body}</p>
					</div>
				)}

				<div
					data-slot="bubble-content"
					className={cn(
						"relative rounded-xl px-3 py-2 text-sm leading-relaxed transition-shadow",
						isMine
							? "bg-primary text-primary-foreground rounded-br-md"
							: "bg-muted border border-border/30 rounded-bl-md",
						message.replyTo && "rounded-t-none",
						"group-hover/message:shadow-sm",
					)}
				>
					<p className="whitespace-pre-wrap break-words">{message.body}</p>
				</div>

				{/* Timestamp + read receipt + action button row */}
				<div className={cn(
					"mt-0.5 flex items-center gap-1.5",
					isMine ? "justify-end" : "justify-start",
				)}>
					{/* Hover-only action button */}
					<div className="opacity-0 transition-opacity group-hover/message:opacity-100">
						<DropdownMenu>
							<DropdownMenuTrigger className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
								<MoreHorizontal className="size-3.5" aria-hidden="true" />
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align={isMine ? "end" : "start"} className="w-44">
								<div className="flex items-center gap-1 px-2 py-1.5">
									{QUICK_REACTIONS.map((emoji) => (
										<button
											key={emoji}
											type="button"
											onClick={() => onReact(message.id, emoji)}
											className="cursor-pointer rounded-md px-1 py-0.5 text-base transition-colors hover:bg-muted"
										>
											{emoji}
										</button>
									))}
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer gap-2">
									<Reply className="size-3.5" aria-hidden="true" />
									Reply
								</DropdownMenuItem>
								{isMine && (
									<>
										<DropdownMenuItem onClick={() => onEdit(message)} className="cursor-pointer gap-2">
											<Pencil className="size-3.5" aria-hidden="true" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => onDelete(message.id)}
											className="cursor-pointer gap-2 text-destructive focus:text-destructive"
										>
											<Trash2 className="size-3.5" aria-hidden="true" />
											Delete
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{message.editedAt && (
						<span className={cn("text-[11px]", isMine ? "text-primary-foreground/50" : "text-muted-foreground")}>
							edited
						</span>
					)}
					<span className={cn("text-[11px]", isMine ? "text-primary-foreground/50" : "text-muted-foreground")}>
						{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
					</span>
					{isMine && <ReadReceipt status={receiptStatus} />}
				</div>

				{Object.keys(reactionGroups).length > 0 && (
					<div className={cn("mt-1 flex flex-wrap gap-1", isMine ? "justify-end" : "justify-start")}>
						{Object.entries(reactionGroups).map(([emoji, userIds]) => (
							<button
								key={emoji}
								type="button"
								onClick={() => onReact(message.id, emoji)}
								className="flex cursor-pointer items-center gap-1 rounded-full border border-border/30 bg-background px-2 py-0.5 text-xs shadow-xs transition-colors hover:bg-muted"
							>
								<span>{emoji}</span>
								<span className="text-muted-foreground">{userIds.length}</span>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
