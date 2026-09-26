# Messaging Improvement — Step-by-Step Implementation Guide

> **Purpose**: This document contains the exact code for every file change needed to implement Phase 1 of the messaging improvement. An LLM (or developer) should be able to follow this top-to-bottom and produce a working result.
>
> **Execution order matters** — follow the numbered steps sequentially.

---

## Pre-requisites

```bash
# Install emoji picker dependency
cd /home/tl-wr840n/Documents/Projects/development/tgaw-new
npm install @emoji-mart/react @emoji-mart/data
```

---

## Step 1 — Prisma Schema Changes

**File**: `prisma/schema.prisma`

### 1A. Add `username` to the User model

Find this block:

```prisma
model User {
  id            String    @id @map("_id")
  email         String    @unique
  passwordHash  String?
  name          String
```

Replace with:

```prisma
model User {
  id            String    @id @map("_id")
  email         String    @unique
  username      String?   @unique
  passwordHash  String?
  name          String
```

### 1B. Extend the Message model

Find the existing `Message` model. Replace it entirely with:

```prisma
model Message {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  conversationId   String       @db.ObjectId
  conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId         String
  body             String
  editedAt         DateTime?
  deletedAt        DateTime?
  replyToId        String?      @db.ObjectId
  attachmentUrl    String?
  readBy           String[]
  createdAt        DateTime     @default(now())
  reactions        MessageReaction[]

  @@index([conversationId])
  @@index([replyToId])
}
```

### 1C. Add the MessageReaction model

Add this new model directly after the `Message` model:

```prisma
model MessageReaction {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  messageId String   @db.ObjectId
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  emoji     String
  createdAt DateTime @default(now())

  @@unique([messageId, userId, emoji])
  @@index([messageId])
  @@map("message_reaction")
}
```

### 1D. Regenerate Prisma Client

```bash
npx prisma generate
```

---

## Step 2 — Zod Schemas

### 2A. Update messageSchema.ts

**File**: `lib/schemas/messageSchema.ts`

**Replace the entire file** with:

```typescript
import { z } from "zod";

export const createMessageSchema = z.object({
	conversationId: z.string().min(1, "Conversation ID is required"),
	body: z.string().min(1, "Message body is required"),
	replyToId: z.string().optional(),
	attachmentUrl: z.string().url().optional().or(z.literal("")),
});

export const editMessageSchema = z.object({
	body: z.string().min(1, "Message body is required"),
});

export const reactionSchema = z.object({
	emoji: z.string().min(1, "Emoji is required").max(8),
});

export const updateMessageSchema = z.object({
	readBy: z.array(z.string()).optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
```

### 2B. Update onboardingSchema.ts

**File**: `lib/schemas/onboardingSchema.ts`

**Replace the entire file** with:

```typescript
import { z } from "zod"
import { phoneSchema } from "@/lib/schemas/phoneSchema"

export const nameStepSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
})

export const usernameStepSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30, "At most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .transform((v) => v.toLowerCase()),
})

export const contactStepSchema = z.object({
	phone: phoneSchema,
	country: z.string().min(1, "Select a country"),
})

export const aboutStepSchema = z.object({
  sex: z.enum(["male", "female"], { message: "Select an option" }),
  ageRange: z.enum(
    ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"],
    { message: "Select an age range" }
  ),
})

export const timezoneStepSchema = z.object({
  timezone: z.string().min(1, "Select your time zone"),
})

export const onboardingSchema = nameStepSchema
  .merge(usernameStepSchema)
  .merge(contactStepSchema)
  .merge(aboutStepSchema)
  .merge(timezoneStepSchema)

export type OnboardingValues = z.infer<typeof onboardingSchema>

export const ONBOARDING_STEPS = [
  { id: "name", label: "Your Name", schema: nameStepSchema },
  { id: "username", label: "Username", schema: usernameStepSchema },
  { id: "contact", label: "Contact", schema: contactStepSchema },
  { id: "about", label: "About You", schema: aboutStepSchema },
  { id: "timezone", label: "Time Zone", schema: timezoneStepSchema },
  { id: "complete", label: "Complete", schema: z.object({}) },
] as const

export const TIMEZONE_OPTIONS = [
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Honolulu" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles" },
  { value: "America/Denver", label: "(GMT-07:00) Denver" },
  { value: "America/Chicago", label: "(GMT-06:00) Chicago" },
  { value: "America/New_York", label: "(GMT-05:00) New York" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Africa/Accra", label: "(GMT+00:00) Accra" },
  { value: "Africa/Lagos", label: "(GMT+01:00) Lagos" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Berlin" },
  { value: "Africa/Johannesburg", label: "(GMT+02:00) Johannesburg" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Kolkata" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
] as const
```

---

## Step 3 — API Routes

### 3A. Update conversations GET to resolve member names

**File**: `app/api/v1/conversations/route.ts`

**Replace the entire file** with:

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createSchema = z.object({
  type: z.enum(["DIRECT", "GROUP"]),
  groupId: z.string().optional(),
  memberIds: z.array(z.string()).min(1).max(20),
})

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })

  const conversations = await prisma.conversation.findMany({
    where: { memberIds: { has: session.user.id! } },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  })

  // Resolve member names, usernames, initials, and images
  const allMemberIds = [...new Set(conversations.flatMap((c) => c.memberIds))]
  const users = await prisma.user.findMany({
    where: { id: { in: allMemberIds } },
    select: { id: true, name: true, username: true, initials: true, image: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  // Compute unread counts per conversation for the current user
  const conversationsWithMeta = conversations.map((c) => {
    // Count messages in the conversation where readBy doesn't include current user
    // We only have the last message included — for full unread count we'd need a separate query
    // For now, mark as "hasUnread" based on last message
    const lastMsg = c.messages[0]
    const hasUnread = lastMsg ? !lastMsg.readBy.includes(session.user.id!) : false

    return {
      ...c,
      members: c.memberIds.map((id) => userMap[id] || { id, name: id.slice(0, 8), username: null, initials: null, image: null }),
      hasUnread,
    }
  })

  return NextResponse.json({ success: true, data: conversationsWithMeta })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })

  let { type, groupId, memberIds } = parsed.data
  // ensure current user in memberIds
  if (!memberIds.includes(session.user.id!)) memberIds = [...memberIds, session.user.id!]

  // for DIRECT, deduplicate: find existing with same 2 members
  if (type === "DIRECT" && memberIds.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: { type: "DIRECT", memberIds: { hasEvery: memberIds } },
    })
    // need exact match (not superset) — filter in memory
    const exact = existing && existing.memberIds.length === 2 && memberIds.every((id) => existing.memberIds.includes(id))
    if (exact) return NextResponse.json({ success: true, data: existing })
  }

  const conv = await prisma.conversation.create({
    data: { type: type as never, groupId: groupId || undefined, memberIds },
  })
  return NextResponse.json({ success: true, data: conv }, { status: 201 })
}
```

### 3B. Update messages route (GET includes reactions/replyTo; POST accepts replyToId)

**File**: `app/api/v1/messages/route.ts`

**Replace the entire file** with:

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createMessageSchema } from "@/lib/schemas/messageSchema";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { searchParams } = new URL(req.url);
	const conversationId = searchParams.get("conversationId");
	const limit = Number(searchParams.get("limit")) || 50;
	const cursor = searchParams.get("cursor"); // message ID for cursor-based pagination

	const where = conversationId
		? { conversationId }
		: { conversation: { memberIds: { has: session.user.id! } } };

	const messages = await prisma.message.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		include: {
			reactions: {
				select: { id: true, userId: true, emoji: true },
			},
		},
	});

	// For messages that are replies, fetch the replied-to message (slim)
	const replyToIds = messages
		.map((m) => m.replyToId)
		.filter((id): id is string => id !== null && id !== undefined);

	let replyToMap: Record<string, { id: string; body: string; senderId: string }> = {};
	if (replyToIds.length > 0) {
		const replyMessages = await prisma.message.findMany({
			where: { id: { in: replyToIds } },
			select: { id: true, body: true, senderId: true },
		});
		replyToMap = Object.fromEntries(replyMessages.map((m) => [m.id, m]));
	}

	// Resolve sender names for display
	const senderIds = [...new Set(messages.map((m) => m.senderId))];
	const senders = await prisma.user.findMany({
		where: { id: { in: senderIds } },
		select: { id: true, name: true, username: true, initials: true, image: true },
	});
	const senderMap = Object.fromEntries(senders.map((u) => [u.id, u]));

	const enriched = messages.map((m) => ({
		...m,
		replyTo: m.replyToId ? replyToMap[m.replyToId] || null : null,
		sender: senderMap[m.senderId] || null,
	}));

	return NextResponse.json({ success: true, data: enriched });
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const body = await req.json();
	const validation = createMessageSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	// Verify sender is a member of the conversation
	const conv = await prisma.conversation.findUnique({
		where: { id: validation.data.conversationId },
		select: { memberIds: true },
	});
	if (!conv || !conv.memberIds.includes(session.user.id!)) {
		return NextResponse.json(
			{ success: false, error: "Not a member of this conversation" },
			{ status: 403 },
		);
	}

	const message = await prisma.message.create({
		data: {
			conversationId: validation.data.conversationId,
			body: validation.data.body,
			replyToId: validation.data.replyToId || undefined,
			senderId: session.user.id!,
			readBy: [session.user.id!],
		},
		include: {
			reactions: {
				select: { id: true, userId: true, emoji: true },
			},
		},
	});

	// Update conversation.updatedAt
	await prisma.conversation.update({
		where: { id: validation.data.conversationId },
		data: { updatedAt: new Date() },
	});

	// Fetch sender info to include in response
	const sender = await prisma.user.findUnique({
		where: { id: session.user.id! },
		select: { id: true, name: true, username: true, initials: true, image: true },
	});

	return NextResponse.json(
		{ success: true, data: { ...message, replyTo: null, sender } },
		{ status: 201 },
	);
}
```

### 3C. Update messages/[id] route — add edit + soft-delete

**File**: `app/api/v1/messages/[id]/route.ts`

**Replace the entire file** with:

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { editMessageSchema } from "@/lib/schemas/messageSchema";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { id } = await params;
	const message = await prisma.message.findUnique({ where: { id } });
	if (!message)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);

	const body = await req.json();

	// Branch 1: Edit message body (only by sender)
	if (body.body !== undefined) {
		if (message.senderId !== session.user.id!) {
			return NextResponse.json(
				{ success: false, error: "Only the sender can edit" },
				{ status: 403 },
			);
		}
		const validation = editMessageSchema.safeParse(body);
		if (!validation.success)
			return NextResponse.json(
				{ success: false, error: validation.error.format() },
				{ status: 400 },
			);

		const updated = await prisma.message.update({
			where: { id },
			data: { body: validation.data.body, editedAt: new Date() },
		});
		return NextResponse.json({ success: true, data: updated });
	}

	// Branch 2: Mark as read (existing logic)
	const readBy = message.readBy.includes(session.user.id!)
		? message.readBy
		: [...message.readBy, session.user.id!];

	const updated = await prisma.message.update({
		where: { id },
		data: { readBy },
	});

	return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { id } = await params;
	const message = await prisma.message.findUnique({ where: { id } });
	if (!message)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);

	if (message.senderId !== session.user.id!) {
		return NextResponse.json(
			{ success: false, error: "Only the sender can delete" },
			{ status: 403 },
		);
	}

	// Soft delete
	const updated = await prisma.message.update({
		where: { id },
		data: { deletedAt: new Date(), body: "" },
	});

	return NextResponse.json({ success: true, data: updated });
}
```

### 3D. Create reactions route

**File**: `app/api/v1/messages/[id]/reactions/route.ts` (NEW)

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { reactionSchema } from "@/lib/schemas/messageSchema";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { id: messageId } = await params;
	const body = await req.json();
	const validation = reactionSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	// Verify message exists
	const message = await prisma.message.findUnique({
		where: { id: messageId },
		select: { id: true, conversationId: true },
	});
	if (!message)
		return NextResponse.json(
			{ success: false, error: "Message not found" },
			{ status: 404 },
		);

	// Upsert reaction (toggle: if exists, remove; if not, create)
	const existing = await prisma.messageReaction.findUnique({
		where: {
			messageId_userId_emoji: {
				messageId,
				userId: session.user.id!,
				emoji: validation.data.emoji,
			},
		},
	});

	if (existing) {
		await prisma.messageReaction.delete({ where: { id: existing.id } });
		return NextResponse.json({
			success: true,
			data: { action: "removed", messageId, emoji: validation.data.emoji, conversationId: message.conversationId },
		});
	}

	const reaction = await prisma.messageReaction.create({
		data: {
			messageId,
			userId: session.user.id!,
			emoji: validation.data.emoji,
		},
	});

	return NextResponse.json({
		success: true,
		data: { action: "added", ...reaction, conversationId: message.conversationId },
	}, { status: 201 });
}
```

### 3E. Create username-check route

**File**: `app/api/v1/users/username-check/route.ts` (NEW)

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const username = searchParams.get("username")?.toLowerCase().trim();

	if (!username || username.length < 3) {
		return NextResponse.json({ available: false, reason: "Too short" });
	}

	if (!/^[a-z0-9_]+$/.test(username)) {
		return NextResponse.json({ available: false, reason: "Invalid characters" });
	}

	const existing = await prisma.user.findFirst({
		where: { username },
		select: { id: true },
	});

	return NextResponse.json({ available: !existing });
}
```

### 3F. Create user search by username route

**File**: `app/api/v1/users/search/route.ts` — if this file already exists, update it. If not, create it:

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });

	const { searchParams } = new URL(req.url);
	const query = searchParams.get("q") || searchParams.get("email") || "";

	if (!query.trim()) {
		return NextResponse.json({ success: true, data: [] });
	}

	// Search by email, username, or name
	const users = await prisma.user.findMany({
		where: {
			AND: [
				{ id: { not: session.user.id! } }, // exclude self
				{
					OR: [
						{ email: { contains: query, mode: "insensitive" } },
						{ username: { contains: query, mode: "insensitive" } },
						{ name: { contains: query, mode: "insensitive" } },
					],
				},
			],
		},
		select: { id: true, name: true, username: true, initials: true, image: true, email: true },
		take: 10,
	});

	return NextResponse.json({ success: true, data: users });
}
```

---

## Step 4 — Socket.IO Server Updates

**File**: `server.ts`

Find the `io.on("connection", ...)` block (around line 78). Replace the entire `io.on("connection", ...)` handler with this expanded version. **Do NOT remove anything outside this block** (the reminder loop, shutdown handlers, etc. stay intact).

```typescript
	// ── Presence tracking ─────────────────────────────────────────────
	const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

	io.on("connection", (socket) => {
		const userId = (socket.data as { userId: string }).userId;

		// Track presence
		if (!onlineUsers.has(userId)) {
			onlineUsers.set(userId, new Set());
		}
		onlineUsers.get(userId)!.add(socket.id);

		// Broadcast online if this is the user's first socket
		if (onlineUsers.get(userId)!.size === 1) {
			io?.emit("presence:online", { userId });
		}

		// Return list of currently online user IDs
		socket.on("presence:query", (callback: (userIds: string[]) => void) => {
			if (typeof callback === "function") {
				callback([...onlineUsers.keys()]);
			}
		});

		socket.on("conversation:join", async (conversationId: string) => {
			socket.join(conversationId);

			// Auto-mark messages as read when joining a conversation
			try {
				await prisma.message.updateMany({
					where: {
						conversationId,
						NOT: { readBy: { has: userId } },
					},
					data: {
						readBy: { push: userId },
					},
				});
				// Notify the room that this user has read the messages
				io?.to(conversationId).emit("message:read", { conversationId, userId });
			} catch {
				// Non-critical — ignore errors
			}
		});

		socket.on("conversation:leave", (conversationId: string) => {
			socket.leave(conversationId);
		});

		socket.on("message:send", (payload: { conversationId: string; [key: string]: unknown }) => {
			io?.to(payload.conversationId).emit("message:new", payload);
		});

		// Typing indicators
		socket.on("typing:start", (payload: { conversationId: string; userId: string; name: string }) => {
			socket.to(payload.conversationId).emit("typing:start", payload);
		});

		socket.on("typing:stop", (payload: { conversationId: string; userId: string }) => {
			socket.to(payload.conversationId).emit("typing:stop", payload);
		});

		// Message edited
		socket.on("message:edited", (payload: { messageId: string; conversationId: string; body: string; editedAt: string }) => {
			io?.to(payload.conversationId).emit("message:edited", payload);
		});

		// Message deleted
		socket.on("message:deleted", (payload: { messageId: string; conversationId: string }) => {
			io?.to(payload.conversationId).emit("message:deleted", payload);
		});

		// Reaction added/removed
		socket.on("message:reaction", (payload: { messageId: string; conversationId: string; userId: string; emoji: string; action: "add" | "remove" }) => {
			io?.to(payload.conversationId).emit("message:reaction", payload);
		});

		socket.on("disconnect", () => {
			const sockets = onlineUsers.get(userId);
			if (sockets) {
				sockets.delete(socket.id);
				if (sockets.size === 0) {
					onlineUsers.delete(userId);
					io?.emit("presence:offline", { userId });
				}
			}
		});
	});
```

---

## Step 5 — Custom Hooks

### 5A. usePresence hook

**File**: `lib/hooks/usePresence.ts` (NEW)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";

export function usePresence() {
	const { socket } = useSocket();
	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!socket) return;

		// Query initial online users
		socket.emit("presence:query", (userIds: string[]) => {
			setOnlineUserIds(new Set(userIds));
		});

		const onOnline = ({ userId }: { userId: string }) => {
			setOnlineUserIds((prev) => {
				const next = new Set(prev);
				next.add(userId);
				return next;
			});
		};

		const onOffline = ({ userId }: { userId: string }) => {
			setOnlineUserIds((prev) => {
				const next = new Set(prev);
				next.delete(userId);
				return next;
			});
		};

		socket.on("presence:online", onOnline);
		socket.on("presence:offline", onOffline);

		return () => {
			socket.off("presence:online", onOnline);
			socket.off("presence:offline", onOffline);
		};
	}, [socket]);

	const isOnline = useCallback(
		(userId: string) => onlineUserIds.has(userId),
		[onlineUserIds],
	);

	return { onlineUserIds, isOnline };
}
```

### 5B. useTyping hook

**File**: `lib/hooks/useTyping.ts` (NEW)

```typescript
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";

interface TypingUser {
	userId: string;
	name: string;
}

export function useTyping(conversationId: string | null, myId: string | undefined, myName: string | undefined) {
	const { socket } = useSocket();
	const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isTypingRef = useRef(false);

	// Listen for typing events from others
	useEffect(() => {
		if (!socket || !conversationId) return;

		const timeouts = new Map<string, NodeJS.Timeout>();

		const onStart = (payload: { conversationId: string; userId: string; name: string }) => {
			if (payload.conversationId !== conversationId) return;
			if (payload.userId === myId) return;

			setTypingUsers((prev) => {
				if (prev.some((u) => u.userId === payload.userId)) return prev;
				return [...prev, { userId: payload.userId, name: payload.name }];
			});

			// Auto-clear after 4s if no stop event received
			if (timeouts.has(payload.userId)) clearTimeout(timeouts.get(payload.userId));
			timeouts.set(
				payload.userId,
				setTimeout(() => {
					setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
					timeouts.delete(payload.userId);
				}, 4000),
			);
		};

		const onStop = (payload: { conversationId: string; userId: string }) => {
			if (payload.conversationId !== conversationId) return;
			setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
			if (timeouts.has(payload.userId)) {
				clearTimeout(timeouts.get(payload.userId));
				timeouts.delete(payload.userId);
			}
		};

		socket.on("typing:start", onStart);
		socket.on("typing:stop", onStop);

		return () => {
			socket.off("typing:start", onStart);
			socket.off("typing:stop", onStop);
			for (const t of timeouts.values()) clearTimeout(t);
			timeouts.clear();
			setTypingUsers([]);
		};
	}, [socket, conversationId, myId]);

	// Emit typing events (debounced)
	const emitTyping = useCallback(() => {
		if (!socket || !conversationId || !myId) return;

		if (!isTypingRef.current) {
			isTypingRef.current = true;
			socket.emit("typing:start", { conversationId, userId: myId, name: myName || "Someone" });
		}

		// Reset the stop timeout
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			isTypingRef.current = false;
			socket.emit("typing:stop", { conversationId, userId: myId });
		}, 3000);
	}, [socket, conversationId, myId, myName]);

	const stopTyping = useCallback(() => {
		if (!socket || !conversationId || !myId) return;
		if (isTypingRef.current) {
			isTypingRef.current = false;
			socket.emit("typing:stop", { conversationId, userId: myId });
		}
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = null;
		}
	}, [socket, conversationId, myId]);

	return { typingUsers, emitTyping, stopTyping };
}
```

### 5C. useMessages hook

**File**: `lib/hooks/useMessages.ts` (NEW)

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/providers/SocketProvider";

export interface MessageUser {
	id: string;
	name: string;
	username: string | null;
	initials: string | null;
	image: string | null;
}

export interface MessageReaction {
	id: string;
	userId: string;
	emoji: string;
}

export interface ReplyTo {
	id: string;
	body: string;
	senderId: string;
}

export interface ChatMessage {
	id: string;
	conversationId: string;
	senderId: string;
	body: string;
	editedAt: string | null;
	deletedAt: string | null;
	replyToId: string | null;
	replyTo: ReplyTo | null;
	readBy: string[];
	reactions: MessageReaction[];
	sender: MessageUser | null;
	createdAt: string;
}

export function useMessages(conversationId: string | null) {
	const { socket } = useSocket();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
		});
	}, []);

	// Fetch messages
	const loadMessages = useCallback(async (convId: string) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/v1/messages?conversationId=${convId}&limit=50`);
			const data = await res.json();
			if (data.success) {
				setMessages([...data.data].reverse());
				setTimeout(scrollToBottom, 100);
			}
		} finally {
			setLoading(false);
		}
	}, [scrollToBottom]);

	useEffect(() => {
		if (!conversationId) {
			setMessages([]);
			return;
		}
		loadMessages(conversationId);
	}, [conversationId, loadMessages]);

	// Socket subscriptions
	useEffect(() => {
		if (!socket || !conversationId) return;

		const onNew = (msg: ChatMessage) => {
			if (msg.conversationId === conversationId) {
				setMessages((prev) => {
					// Avoid duplicates
					if (prev.some((m) => m.id === msg.id)) return prev;
					return [...prev, msg];
				});
				scrollToBottom();
			}
		};

		const onEdited = (payload: { messageId: string; conversationId: string; body: string; editedAt: string }) => {
			if (payload.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) =>
					m.id === payload.messageId ? { ...m, body: payload.body, editedAt: payload.editedAt } : m,
				),
			);
		};

		const onDeleted = (payload: { messageId: string; conversationId: string }) => {
			if (payload.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) =>
					m.id === payload.messageId ? { ...m, deletedAt: new Date().toISOString(), body: "" } : m,
				),
			);
		};

		const onReaction = (payload: { messageId: string; conversationId: string; userId: string; emoji: string; action: "add" | "remove" }) => {
			if (payload.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) => {
					if (m.id !== payload.messageId) return m;
					if (payload.action === "add") {
						return {
							...m,
							reactions: [
								...m.reactions,
								{ id: `${payload.userId}-${payload.emoji}`, userId: payload.userId, emoji: payload.emoji },
							],
						};
					}
					return {
						...m,
						reactions: m.reactions.filter(
							(r) => !(r.userId === payload.userId && r.emoji === payload.emoji),
						),
					};
				}),
			);
		};

		const onRead = (payload: { conversationId: string; userId: string }) => {
			if (payload.conversationId !== conversationId) return;
			setMessages((prev) =>
				prev.map((m) => ({
					...m,
					readBy: m.readBy.includes(payload.userId)
						? m.readBy
						: [...m.readBy, payload.userId],
				})),
			);
		};

		socket.on("message:new", onNew);
		socket.on("message:edited", onEdited);
		socket.on("message:deleted", onDeleted);
		socket.on("message:reaction", onReaction);
		socket.on("message:read", onRead);

		return () => {
			socket.off("message:new", onNew);
			socket.off("message:edited", onEdited);
			socket.off("message:deleted", onDeleted);
			socket.off("message:reaction", onReaction);
			socket.off("message:read", onRead);
		};
	}, [socket, conversationId, scrollToBottom]);

	return { messages, setMessages, loading, scrollRef, scrollToBottom };
}
```

---

## Step 6 — UI Components

### 6A. PresenceIndicator

**File**: `components/messages/PresenceIndicator.tsx` (NEW)

```tsx
"use client";

import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
	online: boolean;
	className?: string;
	size?: "sm" | "md";
}

export function PresenceIndicator({ online, className, size = "sm" }: PresenceIndicatorProps) {
	return (
		<span
			className={cn(
				"absolute rounded-full border-2 border-background",
				size === "sm" ? "size-2.5 bottom-0 right-0" : "size-3 bottom-0 right-0",
				online ? "bg-emerald-500" : "bg-muted-foreground/40",
				className,
			)}
			aria-label={online ? "Online" : "Offline"}
		/>
	);
}
```

### 6B. TypingIndicator

**File**: `components/messages/TypingIndicator.tsx` (NEW)

```tsx
"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
	users: { userId: string; name: string }[];
	className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
	if (users.length === 0) return null;

	const names =
		users.length === 1
			? users[0].name
			: users.length === 2
				? `${users[0].name} and ${users[1].name}`
				: `${users[0].name} and ${users.length - 1} others`;

	return (
		<div className={cn("flex items-center gap-2 px-4 py-1.5", className)}>
			<div className="flex items-center gap-0.5">
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
			</div>
			<span className="text-xs text-muted-foreground">
				{names} {users.length === 1 ? "is" : "are"} typing…
			</span>
		</div>
	);
}
```

### 6C. ReadReceipt

**File**: `components/messages/ReadReceipt.tsx` (NEW)

```tsx
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
```

### 6D. ChatBubble

**File**: `components/messages/ChatBubble.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReadReceipt } from "./ReadReceipt";
import { MoreHorizontal, Reply, Pencil, Trash2, SmilePlus } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage, MessageUser } from "@/lib/hooks/useMessages";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

interface ChatBubbleProps {
	message: ChatMessage;
	isMine: boolean;
	memberCount: number;
	onReply: (message: ChatMessage) => void;
	onEdit: (message: ChatMessage) => void;
	onDelete: (messageId: string) => void;
	onReact: (messageId: string, emoji: string) => void;
	senderName?: string;
}

export function ChatBubble({
	message,
	isMine,
	memberCount,
	onReply,
	onEdit,
	onDelete,
	onReact,
}: ChatBubbleProps) {
	const [showActions, setShowActions] = useState(false);

	// Soft-deleted messages
	if (message.deletedAt) {
		return (
			<div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
				<div className="max-w-[75%] rounded-2xl border border-dashed border-muted-foreground/20 px-4 py-2.5">
					<p className="text-xs italic text-muted-foreground">This message was deleted</p>
				</div>
			</div>
		);
	}

	// Read receipt status
	const readCount = message.readBy.length;
	const receiptStatus: "sent" | "delivered" | "read" =
		readCount > 1 ? "read" : readCount === 1 ? "delivered" : "sent";

	// Group reactions by emoji
	const reactionGroups = message.reactions.reduce<Record<string, string[]>>((acc, r) => {
		if (!acc[r.emoji]) acc[r.emoji] = [];
		acc[r.emoji].push(r.userId);
		return acc;
	}, {});

	return (
		<div
			className={cn("group flex", isMine ? "justify-end" : "justify-start")}
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => setShowActions(false)}
		>
			<div className="relative max-w-[75%]">
				{/* Reply preview bar */}
				{message.replyTo && (
					<div
						className={cn(
							"mb-1 rounded-t-xl border-l-2 px-3 py-1.5 text-xs",
							isMine
								? "border-l-primary-foreground/40 bg-primary/80 text-primary-foreground/70"
								: "border-l-primary bg-muted/80 text-muted-foreground",
						)}
					>
						<p className="truncate font-medium">{message.replyTo.body}</p>
					</div>
				)}

				{/* Bubble */}
				<div
					className={cn(
						"relative rounded-2xl px-4 py-2.5 text-sm",
						isMine
							? "bg-primary text-primary-foreground rounded-br-md"
							: "bg-muted border border-border/50 rounded-bl-md",
						message.replyTo && "rounded-t-none",
					)}
				>
					<p className="whitespace-pre-wrap break-words">{message.body}</p>

					{/* Timestamp + edited + receipt */}
					<div className={cn("mt-1 flex items-center gap-1.5", isMine ? "justify-end" : "justify-start")}>
						{message.editedAt && (
							<span className={cn("text-[10px]", isMine ? "text-primary-foreground/50" : "text-muted-foreground")}>
								edited
							</span>
						)}
						<span className={cn("text-[10px]", isMine ? "text-primary-foreground/50" : "text-muted-foreground")}>
							{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
						</span>
						{isMine && <ReadReceipt status={receiptStatus} />}
					</div>
				</div>

				{/* Reactions row */}
				{Object.keys(reactionGroups).length > 0 && (
					<div className={cn("mt-1 flex flex-wrap gap-1", isMine ? "justify-end" : "justify-start")}>
						{Object.entries(reactionGroups).map(([emoji, userIds]) => (
							<button
								key={emoji}
								type="button"
								onClick={() => onReact(message.id, emoji)}
								className="flex cursor-pointer items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs shadow-xs transition-colors hover:bg-muted"
							>
								<span>{emoji}</span>
								<span className="text-muted-foreground">{userIds.length}</span>
							</button>
						))}
					</div>
				)}

				{/* Action menu (visible on hover) */}
				{showActions && (
					<div
						className={cn(
							"absolute -top-2 z-10 flex items-center gap-0.5 rounded-lg border bg-popover p-0.5 shadow-md",
							isMine ? "right-0" : "left-0",
						)}
					>
						{QUICK_REACTIONS.slice(0, 3).map((emoji) => (
							<button
								key={emoji}
								type="button"
								onClick={() => onReact(message.id, emoji)}
								className="cursor-pointer rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted"
							>
								{emoji}
							</button>
						))}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<MoreHorizontal className="size-3.5" aria-hidden="true" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align={isMine ? "end" : "start"} className="w-44">
								{/* More reactions */}
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
				)}
			</div>
		</div>
	);
}
```

### 6E. ChatInput

**File**: `components/messages/ChatInput.tsx` (NEW)

```tsx
"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Send, X, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ChatMessage } from "@/lib/hooks/useMessages";

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

	// Auto-resize textarea
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
	}, [value]);

	// Focus when replying or editing
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
			{/* Reply preview bar */}
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

			{/* Edit preview bar */}
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

			{/* Input row */}
			<div className="flex items-end gap-2 p-3">
				{/* Emoji picker */}
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

				{/* Auto-expanding textarea */}
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

				{/* Send button */}
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
```

### 6F. ConversationList

**File**: `components/messages/ConversationList.tsx` (NEW)

```tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresenceIndicator } from "./PresenceIndicator";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export interface ConversationMember {
	id: string;
	name: string;
	username: string | null;
	initials: string | null;
	image: string | null;
}

export interface Conversation {
	id: string;
	type: "DIRECT" | "GROUP";
	groupId?: string | null;
	memberIds: string[];
	members: ConversationMember[];
	messages?: { id: string; body: string; senderId: string; readBy: string[]; createdAt: string }[];
	hasUnread: boolean;
	updatedAt: string;
}

interface ConversationListProps {
	conversations: Conversation[];
	activeId: string | null;
	myId: string | undefined;
	isOnline: (userId: string) => boolean;
	onSelect: (id: string) => void;
	onConversationCreated: () => void;
	loading: boolean;
}

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "now";
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days}d`;
	return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationList({
	conversations,
	activeId,
	myId,
	isOnline,
	onSelect,
	onConversationCreated,
	loading,
}: ConversationListProps) {
	const [newChatOpen, setNewChatOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<ConversationMember[]>([]);
	const [searching, setSearching] = useState(false);
	const [starting, setStarting] = useState(false);

	// Debounced user search
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		const timer = setTimeout(async () => {
			setSearching(true);
			try {
				const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(searchQuery)}`);
				const data = await res.json();
				if (data.success) setSearchResults(data.data);
			} finally {
				setSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	async function startConversation(userId: string) {
		setStarting(true);
		try {
			const res = await fetch("/api/v1/conversations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "DIRECT", memberIds: [userId] }),
			});
			const data = await res.json();
			if (!data.success) throw new Error(data.error || "Failed");
			onConversationCreated();
			onSelect(data.data.id);
			setNewChatOpen(false);
			setSearchQuery("");
			toast.success("Conversation ready");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		} finally {
			setStarting(false);
		}
	}

	return (
		<div className="flex h-full flex-col border-r bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h2 className="text-base font-semibold tracking-tight" style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
					Messages
				</h2>
				<Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
					<DialogTrigger asChild>
						<Button size="icon" variant="ghost" className="size-8 cursor-pointer">
							<Plus className="size-4" aria-hidden="true" />
							<span className="sr-only">New chat</span>
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
								New Conversation
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
								<Input
									placeholder="Search by name, username, or email…"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-10 pl-9"
								/>
							</div>
							<div className="max-h-60 space-y-1 overflow-auto">
								{searching && (
									<div className="flex items-center justify-center py-6">
										<Loader2 className="size-5 animate-spin text-muted-foreground" />
									</div>
								)}
								{!searching && searchResults.length === 0 && searchQuery.trim() && (
									<p className="py-6 text-center text-sm text-muted-foreground">No users found</p>
								)}
								{searchResults.map((user) => (
									<button
										key={user.id}
										type="button"
										onClick={() => startConversation(user.id)}
										disabled={starting}
										className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
									>
										<Avatar className="size-9">
											{user.image && <AvatarImage src={user.image} alt={user.name} />}
											<AvatarFallback className="text-xs">
												{user.initials || user.name.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">{user.name}</p>
											{user.username && (
												<p className="truncate text-xs text-muted-foreground">@{user.username}</p>
											)}
										</div>
									</button>
								))}
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Conversation list */}
			<ScrollArea className="flex-1">
				<div className="space-y-0.5 p-2">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-5 animate-spin text-muted-foreground" />
						</div>
					) : conversations.length === 0 ? (
						<EmptyState
							icon={MessageSquare}
							title="No conversations yet"
							description="Start a new conversation using the + button above."
							className="my-6"
						/>
					) : (
						conversations.map((conv) => {
							const otherMember = conv.type === "DIRECT"
								? conv.members.find((m) => m.id !== myId)
								: null;
							const isActive = conv.id === activeId;
							const lastMsg = conv.messages?.[0];
							const displayName = otherMember?.name || (conv.type === "GROUP" ? "Group Chat" : "Unknown");
							const displayUsername = otherMember?.username;
							const online = otherMember ? isOnline(otherMember.id) : false;

							return (
								<button
									key={conv.id}
									type="button"
									onClick={() => onSelect(conv.id)}
									className={cn(
										"flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
										isActive
											? "bg-muted shadow-sm"
											: "hover:bg-muted/50",
									)}
								>
									{/* Avatar with presence */}
									<div className="relative shrink-0">
										<Avatar className="size-10">
											{otherMember?.image && (
												<AvatarImage src={otherMember.image} alt={displayName} />
											)}
											<AvatarFallback className="text-xs font-medium">
												{otherMember?.initials || displayName.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										{conv.type === "DIRECT" && <PresenceIndicator online={online} />}
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<p className={cn("truncate text-sm", conv.hasUnread ? "font-semibold" : "font-medium")}>
												{displayName}
											</p>
											{lastMsg && (
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{timeAgo(lastMsg.createdAt)}
												</span>
											)}
										</div>
										<div className="flex items-center justify-between gap-2">
											<p className={cn(
												"truncate text-xs",
												conv.hasUnread ? "font-medium text-foreground" : "text-muted-foreground",
											)}>
												{lastMsg?.body || "No messages yet"}
											</p>
											{conv.hasUnread && (
												<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
													•
												</span>
											)}
										</div>
									</div>
								</button>
							);
						})
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
```

### 6G. ChatPanel

**File**: `components/messages/ChatPanel.tsx` (NEW)

```tsx
"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PresenceIndicator } from "./PresenceIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { useMessages, type ChatMessage } from "@/lib/hooks/useMessages";
import { useTyping } from "@/lib/hooks/useTyping";
import { useSocket } from "@/providers/SocketProvider";
import { toast } from "sonner";
import type { ConversationMember } from "./ConversationList";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatPanelProps {
	conversationId: string | null;
	myId: string | undefined;
	myName: string | undefined;
	otherMember: ConversationMember | null;
	memberCount: number;
	isOnline: (userId: string) => boolean;
	onBack?: () => void; // mobile only
	showBackButton?: boolean;
}

function dateSeparator(dateStr: string): string {
	const date = new Date(dateStr);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (date.toDateString() === today.toDateString()) return "Today";
	if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
	return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

export function ChatPanel({
	conversationId,
	myId,
	myName,
	otherMember,
	memberCount,
	isOnline,
	onBack,
	showBackButton,
}: ChatPanelProps) {
	const { socket } = useSocket();
	const { messages, setMessages, loading, scrollRef, scrollToBottom } = useMessages(conversationId);
	const { typingUsers, emitTyping, stopTyping } = useTyping(conversationId, myId, myName);

	const [inputValue, setInputValue] = useState("");
	const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
	const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	// Send message
	const handleSend = useCallback(async () => {
		const text = inputValue.trim();
		if (!text || !conversationId) return;

		stopTyping();

		// Edit mode
		if (editingMessage) {
			try {
				const res = await fetch(`/api/v1/messages/${editingMessage.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ body: text }),
				});
				const data = await res.json();
				if (data.success) {
					setMessages((prev) =>
						prev.map((m) => (m.id === editingMessage.id ? { ...m, body: text, editedAt: new Date().toISOString() } : m)),
					);
					socket?.emit("message:edited", {
						messageId: editingMessage.id,
						conversationId,
						body: text,
						editedAt: new Date().toISOString(),
					});
				}
			} catch {
				toast.error("Failed to edit");
			}
			setEditingMessage(null);
			setInputValue("");
			return;
		}

		// Normal send
		const payload: Record<string, string> = { conversationId, body: text };
		if (replyTo) payload.replyToId = replyTo.id;

		try {
			const res = await fetch("/api/v1/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!data.success) {
				toast.error("Send failed");
				return;
			}
			socket?.emit("message:send", { conversationId, ...data.data });
			setMessages((prev) => {
				if (prev.some((m) => m.id === data.data.id)) return prev;
				return [...prev, data.data];
			});
			setInputValue("");
			setReplyTo(null);
			scrollToBottom();
		} catch {
			toast.error("Send failed");
		}
	}, [inputValue, conversationId, editingMessage, replyTo, socket, setMessages, stopTyping, scrollToBottom]);

	// Delete message
	const handleDelete = useCallback(async (messageId: string) => {
		try {
			const res = await fetch(`/api/v1/messages/${messageId}`, { method: "DELETE" });
			const data = await res.json();
			if (data.success) {
				setMessages((prev) =>
					prev.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), body: "" } : m)),
				);
				socket?.emit("message:deleted", { messageId, conversationId });
			}
		} catch {
			toast.error("Failed to delete");
		}
		setDeleteConfirmId(null);
	}, [conversationId, socket, setMessages]);

	// React to message
	const handleReact = useCallback(async (messageId: string, emoji: string) => {
		try {
			const res = await fetch(`/api/v1/messages/${messageId}/reactions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emoji }),
			});
			const data = await res.json();
			if (data.success) {
				socket?.emit("message:reaction", {
					messageId,
					conversationId,
					userId: myId,
					emoji,
					action: data.data.action,
				});
				// Optimistic update
				setMessages((prev) =>
					prev.map((m) => {
						if (m.id !== messageId) return m;
						if (data.data.action === "added") {
							return {
								...m,
								reactions: [...m.reactions, { id: `${myId}-${emoji}`, userId: myId!, emoji }],
							};
						}
						return {
							...m,
							reactions: m.reactions.filter((r) => !(r.userId === myId && r.emoji === emoji)),
						};
					}),
				);
			}
		} catch {
			toast.error("Failed to react");
		}
	}, [conversationId, myId, socket, setMessages]);

	// Edit handler — pre-fill input
	const handleStartEdit = useCallback((message: ChatMessage) => {
		setEditingMessage(message);
		setInputValue(message.body);
		setReplyTo(null);
	}, []);

	// Reply handler
	const handleStartReply = useCallback((message: ChatMessage) => {
		setReplyTo(message);
		setEditingMessage(null);
	}, []);

	// Empty state
	if (!conversationId) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/10 p-6">
				<div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
					<MessageSquare className="size-7 text-muted-foreground" aria-hidden="true" />
				</div>
				<p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
			</div>
		);
	}

	// Build date groups for separators
	let lastDateStr = "";

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b px-4 py-3">
				{showBackButton && (
					<button
						type="button"
						onClick={onBack}
						className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Back to conversations"
					>
						<ArrowLeft className="size-5" aria-hidden="true" />
					</button>
				)}
				<div className="relative shrink-0">
					<Avatar className="size-9">
						{otherMember?.image && <AvatarImage src={otherMember.image} alt={otherMember.name} />}
						<AvatarFallback className="text-xs font-medium">
							{otherMember?.initials || otherMember?.name?.slice(0, 2).toUpperCase() || "?"}
						</AvatarFallback>
					</Avatar>
					{otherMember && <PresenceIndicator online={isOnline(otherMember.id)} size="sm" />}
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold" style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
						{otherMember?.name || "Chat"}
					</p>
					<p className="text-xs text-muted-foreground">
						{otherMember && isOnline(otherMember.id) ? "Online" : "Offline"}
					</p>
				</div>
			</div>

			{/* Messages */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
				{loading ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="flex size-12 items-center justify-center rounded-full bg-muted">
							<MessageSquare className="size-5 text-muted-foreground" aria-hidden="true" />
						</div>
						<p className="mt-3 text-sm text-muted-foreground">No messages yet — say hello 👋</p>
					</div>
				) : (
					<div className="space-y-3">
						{messages.map((msg) => {
							const msgDate = dateSeparator(msg.createdAt);
							let showDate = false;
							if (msgDate !== lastDateStr) {
								lastDateStr = msgDate;
								showDate = true;
							}

							return (
								<div key={msg.id}>
									{showDate && (
										<div className="flex items-center justify-center py-2">
											<span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">
												{msgDate}
											</span>
										</div>
									)}
									<ChatBubble
										message={msg}
										isMine={msg.senderId === myId}
										memberCount={memberCount}
										onReply={handleStartReply}
										onEdit={handleStartEdit}
										onDelete={(id) => setDeleteConfirmId(id)}
										onReact={handleReact}
										senderName={msg.sender?.name}
									/>
								</div>
							);
						})}

						{/* Typing indicator */}
						<TypingIndicator users={typingUsers} />
					</div>
				)}
			</div>

			{/* Input */}
			<ChatInput
				value={inputValue}
				onChange={setInputValue}
				onSend={handleSend}
				onTyping={emitTyping}
				replyTo={replyTo}
				onCancelReply={() => setReplyTo(null)}
				editingMessage={editingMessage}
				onCancelEdit={() => {
					setEditingMessage(null);
					setInputValue("");
				}}
			/>

			{/* Delete confirmation */}
			<AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle style={{ fontFamily: "inherit", textTransform: "none", letterSpacing: "normal" }}>
							Delete message?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This message will be removed for everyone in the conversation. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
```

### 6H. ChatShell (main orchestrator)

**File**: `components/messages/ChatShell.tsx` (NEW)

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useSocket } from "@/providers/SocketProvider";
import { usePresence } from "@/lib/hooks/usePresence";
import { ConversationList, type Conversation } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";

export function ChatShell() {
	const { data: session } = useSession();
	const myId = session?.user?.id;
	const myName = session?.user?.name;
	const { socket } = useSocket();
	const { isOnline } = usePresence();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [mobileView, setMobileView] = useState<"list" | "chat">("list");

	// Fetch conversations
	const loadConversations = useCallback(async () => {
		try {
			const res = await fetch("/api/v1/conversations");
			const data = await res.json();
			if (data.success) setConversations(data.data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadConversations();
	}, [loadConversations]);

	// Join/leave socket rooms
	useEffect(() => {
		if (!activeId || !socket) return;
		socket.emit("conversation:join", activeId);
		return () => {
			socket.emit("conversation:leave", activeId);
		};
	}, [activeId, socket]);

	// Listen for new messages to bump conversations
	useEffect(() => {
		if (!socket) return;
		const onNew = (msg: { conversationId: string }) => {
			if (msg.conversationId !== activeId) {
				// Bump conversation to top and mark as unread
				setConversations((prev) => {
					const idx = prev.findIndex((c) => c.id === msg.conversationId);
					if (idx === -1) return prev;
					const copy = [...prev];
					const [hit] = copy.splice(idx, 1);
					copy.unshift({ ...hit, hasUnread: true });
					return copy;
				});
			}
		};
		socket.on("message:new", onNew);
		return () => {
			socket.off("message:new", onNew);
		};
	}, [socket, activeId]);

	// Select conversation
	function handleSelect(id: string) {
		setActiveId(id);
		setMobileView("chat");
		// Clear unread for this conversation
		setConversations((prev) =>
			prev.map((c) => (c.id === id ? { ...c, hasUnread: false } : c)),
		);
	}

	// Resolve other member for the active conversation
	const activeConv = conversations.find((c) => c.id === activeId);
	const otherMember =
		activeConv?.type === "DIRECT"
			? activeConv.members.find((m) => m.id !== myId) || null
			: null;

	return (
		<div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border bg-background shadow-sm">
			{/* Conversation list — hidden on mobile when viewing chat */}
			<div
				className={cn(
					"w-full shrink-0 lg:w-[360px] lg:block",
					mobileView === "chat" ? "hidden" : "block",
				)}
			>
				<ConversationList
					conversations={conversations}
					activeId={activeId}
					myId={myId}
					isOnline={isOnline}
					onSelect={handleSelect}
					onConversationCreated={loadConversations}
					loading={loading}
				/>
			</div>

			{/* Chat panel — hidden on mobile when viewing list */}
			<div
				className={cn(
					"flex-1 lg:block",
					mobileView === "list" ? "hidden" : "block",
				)}
			>
				<ChatPanel
					conversationId={activeId}
					myId={myId}
					myName={myName}
					otherMember={otherMember || null}
					memberCount={activeConv?.memberIds.length || 0}
					isOnline={isOnline}
					onBack={() => setMobileView("list")}
					showBackButton={mobileView === "chat"}
				/>
			</div>
		</div>
	);
}
```

---

## Step 7 — Page File

### 7A. Rewrite the messages page

**File**: `app/(dashboard)/messages/page.tsx`

**Replace the entire file** with:

```tsx
import { ChatShell } from "@/components/messages/ChatShell";

export default function MessagesPage() {
	return <ChatShell />;
}
```

---

## Step 8 — Onboarding Updates

### 8A. Add username step to OnboardingFlow

**File**: `components/onboarding/OnboardingFlow.tsx`

**Add this function** anywhere among the step components (e.g. after `NameStep`):

```tsx
function UsernameStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const { register, watch, formState } = form
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const username = watch("username")

  useEffect(() => {
    setAvailable(null)
    if (!username || username.length < 3) return

    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(`/api/v1/users/username-check?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        setAvailable(data.available)
      } finally {
        setChecking(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Choose a username</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Other members can find you with your @username.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">
          Username <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <Input
            id="username"
            placeholder="john_doe"
            className="h-12 pl-8"
            {...register("username")}
          />
          {checking && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Checking…
            </span>
          )}
          {!checking && available === true && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600">
              ✓ Available
            </span>
          )}
          {!checking && available === false && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">
              ✗ Taken
            </span>
          )}
        </div>
        {formState.errors.username && (
          <p className="text-sm text-destructive">
            {formState.errors.username.message}
          </p>
        )}
      </div>
    </div>
  )
}
```

Then find the step rendering section in the JSX and **add** this line after the name step:

```tsx
{step.id === "username" && <UsernameStep form={form} />}
```

So the block looks like:

```tsx
{step.id === "name" && <NameStep form={form} />}
{step.id === "username" && <UsernameStep form={form} />}
{step.id === "contact" && <ContactStep form={form} />}
{step.id === "about" && <AboutStep form={form} />}
{step.id === "timezone" && <TimezoneStep form={form} />}
{isCompleteStep && <CompleteStep />}
```

### 8B. Update profile API to persist username

**File**: `app/api/v1/profile/route.ts`

In the POST handler, after the `onboardingSchema.safeParse(body)` step, extract `username` from the validated data:

```typescript
const { name, username, phone, country, sex, ageRange, timezone } = validation.data
```

Then, after the `auth.api.updateUser(...)` call, add:

```typescript
// Persist username
if (username) {
  await prisma.user.update({
    where: { id: userId },
    data: { username, onboardingComplete: true },
  })
} else {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingComplete: true },
  })
}
```

---

## Step 9 — Ensure Dialog component exists

Check if `components/ui/dialog.tsx` exists. If not, install it:

```bash
cd /home/tl-wr840n/Documents/Projects/development/tgaw-new
bunx --bun shadcn@latest add dialog
```

---

## Step 10 — Verification

### Build Check

```bash
npx prisma validate
npx prisma generate
npm run build
```

### Manual Testing Checklist

1. **Conversation list**: Shows user names, avatars, presence dots, last message preview, relative timestamps
2. **New chat**: Click + → search by name/username/email → select user → conversation created
3. **Chat bubbles**: iMessage style — right-aligned primary color for sent, left-aligned muted for received
4. **Read receipts**: ✓ (sent) → ✓✓ (delivered) → ✓✓ blue (read)
5. **Typing indicator**: Open two tabs, type in one — see "X is typing..." in the other
6. **Presence**: Green dot when user online, gray when offline
7. **Reply**: Hover message → click reply → preview bar appears above input → send → message shows reply preview
8. **Edit**: Hover own message → click edit → input prefilled → save → "(edited)" label appears
9. **Delete**: Hover own message → click delete → confirm → "This message was deleted" placeholder
10. **Reactions**: Hover → click emoji → reaction badge appears below bubble → click again to remove
11. **Mobile layout**: Resize browser < 1024px → only list visible → tap conversation → only chat visible → tap back arrow → list again
12. **Emoji picker**: Click 😊 icon → emoji grid appears → select → inserted into textarea

---

## File Creation Summary (copy-paste order)

```
1.  MODIFY  prisma/schema.prisma
2.  RUN     npx prisma generate
3.  MODIFY  lib/schemas/messageSchema.ts
4.  MODIFY  lib/schemas/onboardingSchema.ts
5.  MODIFY  app/api/v1/conversations/route.ts
6.  MODIFY  app/api/v1/messages/route.ts
7.  MODIFY  app/api/v1/messages/[id]/route.ts
8.  CREATE  app/api/v1/messages/[id]/reactions/route.ts
9.  CREATE  app/api/v1/users/username-check/route.ts
10. CREATE  app/api/v1/users/search/route.ts  (or update if exists)
11. MODIFY  server.ts  (socket handlers only)
12. CREATE  lib/hooks/usePresence.ts
13. CREATE  lib/hooks/useTyping.ts
14. CREATE  lib/hooks/useMessages.ts
15. CREATE  components/messages/PresenceIndicator.tsx
16. CREATE  components/messages/TypingIndicator.tsx
17. CREATE  components/messages/ReadReceipt.tsx
18. CREATE  components/messages/ChatBubble.tsx
19. CREATE  components/messages/ChatInput.tsx
20. CREATE  components/messages/ConversationList.tsx
21. CREATE  components/messages/ChatPanel.tsx
22. CREATE  components/messages/ChatShell.tsx
23. MODIFY  app/(dashboard)/messages/page.tsx
24. MODIFY  components/onboarding/OnboardingFlow.tsx
25. MODIFY  app/api/v1/profile/route.ts
26. RUN     npm run build
```
