"use client";

import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageSquare className="size-5" />
						Messages
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center gap-4 py-12">
					<p className="text-muted-foreground">No conversations yet</p>
					<p className="text-center text-sm text-muted-foreground max-w-md">
						Start a conversation with fellow believers. Direct messages and
						group chats will appear here.
					</p>
					<Button className="cursor-pointer gap-2">
						<MessageSquarePlus className="size-4" />
						Start Conversation
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
