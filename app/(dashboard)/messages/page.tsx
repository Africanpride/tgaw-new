"use client";

import { ChatShell } from "@/components/messages/ChatShell";

export default function MessagesPage() {
	return (
		<div className="flex h-full flex-col p-0 md:p-0">
			<ChatShell />
		</div>
	);
}
