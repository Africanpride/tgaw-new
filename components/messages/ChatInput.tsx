"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";
import { Send, X, SmilePlus, Paperclip, Mic } from "lucide-react";
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
		<div className="border-t border-border/30 bg-background">
			{replyTo && (
				<div className="flex items-center gap-2 border-b border-border/30 bg-muted/30 px-4 py-2">
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
				<div className="flex items-center gap-2 border-b border-border/30 bg-muted/30 px-4 py-2">
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
				{/* Attach button */}
				<button
					type="button"
					className="mb-0.5 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Attach file"
				>
					<Paperclip className="size-5" aria-hidden="true" />
				</button>

				{/* Textarea with border focus ring */}
				<div className="flex flex-1 items-center rounded-lg border border-border/30 bg-card shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
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
						style={{ fieldSizing: "content" } as React.CSSProperties}
						className="min-h-10 max-h-[120px] flex-1 resize-none border-0 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
					/>

					{/* Emoji button */}
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="mr-1 cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								aria-label="Insert emoji"
							>
								<SmilePlus className="size-5" aria-hidden="true" />
							</button>
						</PopoverTrigger>
						<PopoverContent side="top" align="end" className="w-72 p-2">
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
				</div>

				{/* Send / Mic button */}
				{value.trim() ? (
					<Button
						size="icon"
						onClick={onSend}
						disabled={!value.trim() || disabled}
						className="mb-0.5 size-10 shrink-0 cursor-pointer rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
						aria-label="Send message"
					>
						<Send className="size-4" aria-hidden="true" />
					</Button>
				) : (
					<button
						type="button"
						className="mb-0.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Voice message"
					>
						<Mic className="size-5" aria-hidden="true" />
					</button>
				)}
			</div>
		</div>
	);
}
