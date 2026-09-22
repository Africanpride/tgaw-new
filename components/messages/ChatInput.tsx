"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Send, X, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ChatMessage } from "@/hooks/useMessages";

const EMOJI_GRID = [
	"😀", "😂", "🥰", "😍", "🤔", "😢", "😮", "🙏",
	"❤️", "🔥", "👍", "👎", "👏", "🎉", "💪", "✨",
	"🙌", "😇", "🤗", "😊", "😌", "🥺", "💕", "💯",
	"🕊️", "✝️", "📖", "🛐", "⭐", "🌟", "💝", "🤝",
];

interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	onTyping: () => void;
	replyTo: ChatMessage | null;
	onCancelReply: () => void;
	editingMessage: ChatMessage | null;
	onCancelEdit: () => void;
	disabled?: boolean;
}

export function ChatInput({
	value,
	onChange,
	onSend,
	onTyping,
	replyTo,
	onCancelReply,
	editingMessage,
	onCancelEdit,
	disabled,
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
	}, [value]);

	useEffect(() => {
		if (replyTo || editingMessage) {
			textareaRef.current?.focus();
		}
	}, [replyTo, editingMessage]);

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	}

	function handleEmojiSelect(emoji: string) {
		onChange(value + emoji);
		textareaRef.current?.focus();
	}

	return (
		<div className="border-t bg-background">
			{replyTo && (
				<div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
					<div className="flex-1 border-l-2 border-l-primary pl-3">
						<p className="text-xs font-medium text-primary">
							Replying to {replyTo.sender?.name || "message"}
						</p>
						<p className="truncate text-xs text-muted-foreground">{replyTo.body}</p>
					</div>
					<button
						type="button"
						onClick={onCancelReply}
						className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<X className="size-4" aria-hidden="true" />
					</button>
				</div>
			)}

			{editingMessage && (
				<div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
					<div className="flex-1 border-l-2 border-l-amber-500 pl-3">
						<p className="text-xs font-medium text-amber-600">Editing message</p>
						<p className="truncate text-xs text-muted-foreground">{editingMessage.body}</p>
					</div>
					<button
						type="button"
						onClick={onCancelEdit}
						className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<X className="size-4" aria-hidden="true" />
					</button>
				</div>
			)}

			<div className="flex items-end gap-2 p-3">
				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="mb-0.5 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Insert emoji"
						>
							<SmilePlus className="size-5" aria-hidden="true" />
						</button>
					</PopoverTrigger>
					<PopoverContent side="top" align="start" className="w-72 p-2">
						<div className="grid grid-cols-8 gap-0.5">
							{EMOJI_GRID.map((emoji) => (
								<button
									key={emoji}
									type="button"
									onClick={() => handleEmojiSelect(emoji)}
									className="cursor-pointer rounded-md p-1.5 text-lg transition-colors hover:bg-muted"
								>
									{emoji}
								</button>
							))}
						</div>
					</PopoverContent>
				</Popover>

				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						onTyping();
					}}
					onKeyDown={handleKeyDown}
					placeholder="Type a message…"
					rows={1}
					disabled={disabled}
					className={cn(
						"max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm",
						"outline-none placeholder:text-muted-foreground",
						"focus:border-ring focus:ring-1 focus:ring-ring/50",
						"transition-colors",
					)}
				/>

				<Button
					size="icon"
					onClick={onSend}
					disabled={!value.trim() || disabled}
					className="mb-0.5 size-10 shrink-0 cursor-pointer rounded-full"
					aria-label="Send message"
				>
					<Send className="size-4" aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
}
